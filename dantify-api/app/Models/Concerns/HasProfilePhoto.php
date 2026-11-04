<?php

namespace App\Models\Concerns;

trait HasProfilePhoto
{
    public function getProfilePhotoUrlAttribute(): ?string
    {
        $path = $this->attributes['profile_photo_path'] ?? null;

        if (!$path) {
            return null;
        }

        return asset('storage/' . $path);
    }
}