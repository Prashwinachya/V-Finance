<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\ApiTransformer;
use App\Support\Webauthn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    public function updateProfile(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', 'unique:users,email,'.$request->user()->id],
            'phone' => ['nullable', 'string', 'max:30'],
            'dateOfBirth' => ['nullable', 'date', 'before:today'],
            'gender' => ['nullable', 'in:male,female,non_binary,prefer_not_to_say'],
            'city' => ['nullable', 'string', 'max:120'],
            'country' => ['nullable', 'string', 'max:120'],
            'timezone' => ['nullable', 'string', 'max:80'],
            'bio' => ['nullable', 'string', 'max:1000'],
        ]);

        $user = $request->user();
        $user->fill([
            'name' => $data['name'] ?? $user->name,
            'email' => $data['email'] ?? $user->email,
            'phone' => $data['phone'] ?? $user->phone,
            'date_of_birth' => $data['dateOfBirth'] ?? $user->date_of_birth,
            'gender' => $data['gender'] ?? $user->gender,
            'city' => $data['city'] ?? $user->city,
            'country' => $data['country'] ?? $user->country,
            'timezone' => $data['timezone'] ?? $user->timezone,
            'bio' => $data['bio'] ?? $user->bio,
        ])->save();

        return response()->json(ApiTransformer::user($user));
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ], [
            'avatar.required' => 'Please select an image to upload.',
            'avatar.file' => 'The uploaded file is not valid.',
            'avatar.mimes' => 'Only JPG, PNG, and WEBP image formats are supported.',
            'avatar.max' => 'The image size cannot exceed 2 MB.',
        ]);

        $user = $request->user();
        $file = $request->file('avatar');
        $dir = public_path('uploads/avatars/'.$user->id);
        $previousFile = null;
        $previousRelativePath = $user->avatar_url;

        if ($user->avatar_url && str_starts_with($user->avatar_url, '/uploads/avatars/')) {
            $previousFile = public_path(ltrim($user->avatar_url, '/'));
        }

        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $filename = uniqid('avatar_', true).'.'.$file->getClientOriginalExtension();
        $file->move($dir, $filename);
        $newRelativePath = '/uploads/avatars/'.$user->id.'/'.$filename;

        $user->forceFill([
            'avatar_url' => $newRelativePath,
        ])->save();

        // Backup old avatar before removing it. Keep a copy in storage/app/avatars_backups/{userId}
        if ($previousFile && is_file($previousFile) && $newRelativePath !== $previousRelativePath) {
            try {
                $backupDir = storage_path('app/avatars_backups/'.$user->id);
                if (! is_dir($backupDir)) {
                    mkdir($backupDir, 0755, true);
                }
                $backupName = date('Ymd_His').'__'.basename($previousFile);
                @copy($previousFile, $backupDir.DIRECTORY_SEPARATOR.$backupName);
                // Only delete the old file after successful copy (best-effort)
                if (is_file($backupDir.DIRECTORY_SEPARATOR.$backupName)) {
                    @unlink($previousFile);
                }
            } catch (\Throwable $e) {
                // If backup fails, do not interrupt avatar update — log and continue.
                // Using @ to avoid throwing from production code here.
            }
        }

        return response()->json([
            'avatarUrl' => $user->avatar_url,
            'user' => ApiTransformer::user($user),
            'message' => 'Profile picture updated successfully.',
        ]);
    }

    public function deleteAvatar(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->avatar_url && str_starts_with($user->avatar_url, '/uploads/avatars/')) {
            $filePath = public_path(ltrim($user->avatar_url, '/'));
            if (is_file($filePath)) {
                @unlink($filePath);
            }
        }

        $user->forceFill([
            'avatar_url' => null,
        ])->save();

        return response()->json([
            'avatarUrl' => null,
            'user' => ApiTransformer::user($user),
            'message' => 'Profile picture removed successfully.',
        ]);
    }

    public function listAvatarBackups(Request $request): JsonResponse
    {
        $user = $request->user();
        $backupDir = storage_path('app/avatars_backups/'.$user->id);
        $backups = [];

        if (is_dir($backupDir)) {
            $files = array_values(array_filter(scandir($backupDir), fn($f) => ! in_array($f, ['.', '..'])));
            foreach ($files as $file) {
                $path = $backupDir.DIRECTORY_SEPARATOR.$file;
                if (is_file($path)) {
                    $backups[] = [
                        'filename' => $file,
                        'size' => filesize($path),
                        'modifiedAt' => date('c', filemtime($path)),
                    ];
                }
            }
        }

        return response()->json(['backups' => $backups]);
    }

    public function restoreAvatarBackup(Request $request): JsonResponse
    {
        $data = $request->validate([
            'filename' => ['required', 'string'],
        ]);

        $user = $request->user();
        $backupDir = storage_path('app/avatars_backups/'.$user->id);
        $backupPath = $backupDir.DIRECTORY_SEPARATOR.$data['filename'];

        if (! is_file($backupPath)) {
            return response()->json(['message' => 'Backup not found'], 404);
        }

        $publicDir = public_path('uploads/avatars/'.$user->id);
        if (! is_dir($publicDir)) {
            mkdir($publicDir, 0755, true);
        }

        $newFilename = uniqid('avatar_restored_', true).'.'.pathinfo($backupPath, PATHINFO_EXTENSION);
        $newPublicPath = $publicDir.DIRECTORY_SEPARATOR.$newFilename;

        if (! @copy($backupPath, $newPublicPath)) {
            return response()->json(['message' => 'Unable to restore backup'], 500);
        }

        $newRelativePath = '/uploads/avatars/'.$user->id.'/'.$newFilename;

        // Backup current avatar before switching (best-effort)
        if ($user->avatar_url && str_starts_with($user->avatar_url, '/uploads/avatars/')) {
            $currentFile = public_path(ltrim($user->avatar_url, '/'));
            if (is_file($currentFile)) {
                try {
                    $backupDir = storage_path('app/avatars_backups/'.$user->id);
                    if (! is_dir($backupDir)) mkdir($backupDir, 0755, true);
                    @copy($currentFile, $backupDir.DIRECTORY_SEPARATOR.date('Ymd_His').'__'.basename($currentFile));
                } catch (\Throwable $e) {
                    // ignore
                }
            }
        }

        $user->forceFill(['avatar_url' => $newRelativePath])->save();

        return response()->json(['avatarUrl' => $user->avatar_url, 'user' => ApiTransformer::user($user)]);
    }

    /**
     * @throws ValidationException
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'currentPassword' => ['required', 'string'],
            'newPassword' => ['required', 'string', 'min:6'],
            'confirmPassword' => ['nullable', 'string', 'min:6'],
        ]);

        if (isset($data['confirmPassword']) && $data['newPassword'] !== $data['confirmPassword']) {
            throw ValidationException::withMessages([
                'confirmPassword' => ['New password and confirm password do not match'],
            ]);
        }

        $user = $request->user();

        if (! Hash::check($data['currentPassword'], $user->password)) {
            throw ValidationException::withMessages([
                'currentPassword' => ['Current password is incorrect'],
            ]);
        }

        $user->password = $data['newPassword'];
        $user->save();

        return response()->json(['message' => 'Password updated']);
    }

    public function forgotPasswordReset(Request $request): JsonResponse
    {
        $data = $request->validate([
            'newPassword' => ['required', 'string', 'min:6'],
            'confirmPassword' => ['required', 'string', 'min:6'],
        ]);

        if ($data['newPassword'] !== $data['confirmPassword']) {
            throw ValidationException::withMessages([
                'confirmPassword' => ['New password and confirm password do not match'],
            ]);
        }

        $request->user()->forceFill([
            'password' => $data['newPassword'],
        ])->save();

        return response()->json(['message' => 'Password changed successfully']);
    }

    public function updatePin(Request $request): JsonResponse
    {
        $data = $request->validate([
            'paymentPin' => ['nullable', 'digits:4'],
            'pin' => ['nullable', 'digits:4'],
            'confirmPin' => ['nullable', 'digits:4'],
        ]);

        $pin = $data['paymentPin'] ?? $data['pin'] ?? null;
        $confirm = $data['confirmPin'] ?? null;

        if (! $pin) {
            throw ValidationException::withMessages([
                'paymentPin' => ['Payment PIN is required'],
            ]);
        }

        if ($confirm !== null && $pin !== $confirm) {
            throw ValidationException::withMessages([
                'confirmPin' => ['PIN and confirm PIN do not match'],
            ]);
        }

        $request->user()->forceFill([
            'payment_pin_hash' => Hash::make($pin),
            'payment_pin_enabled' => true,
            'require_payment_pin' => true,
        ])->save();

        return response()->json(['message' => 'Payment PIN updated']);
    }

    public function resetPin(Request $request): JsonResponse
    {
        $request->user()->forceFill([
            'payment_pin_hash' => null,
            'payment_pin_enabled' => false,
            'require_payment_pin' => false,
        ])->save();

        return response()->json(['message' => 'Payment PIN reset']);
    }

    public function updateSecurity(Request $request): JsonResponse
    {
        $data = $request->validate([
            'requirePaymentFingerprint' => ['nullable', 'boolean'],
            'fingerprintEnabled' => ['nullable', 'boolean'],
        ]);

        $user = $request->user();

        if (($data['requirePaymentFingerprint'] ?? false) && (! $user->fingerprint_enabled || ! Webauthn::hasCredential($user))) {
            throw ValidationException::withMessages([
                'requirePaymentFingerprint' => ['Enable fingerprint first before requiring it for payments.'],
            ]);
        }

        $user->forceFill([
            'require_payment_pin' => (bool) $user->payment_pin_enabled,
            'require_payment_fingerprint' => $data['requirePaymentFingerprint'] ?? $user->require_payment_fingerprint,
            'fingerprint_enabled' => $data['fingerprintEnabled'] ?? $user->fingerprint_enabled,
        ])->save();

        return response()->json(ApiTransformer::user($user));
    }
}
