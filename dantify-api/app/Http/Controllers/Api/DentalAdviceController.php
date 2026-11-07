<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DentalAdvice;
use Illuminate\Http\Request;

class DentalAdviceController extends Controller
{
    private function authorizeSuperAdmin(Request $request): void
    {
        abort_unless(
            $request->user()?->role()
                ->where('name', 'superadmin')
                ->exists(),
            403,
            'Only Super Admin can manage dental advices.'
        );
    }

    public function index(Request $request)
    {
        $this->authorizeSuperAdmin($request);

        $query = DentalAdvice::query();

        if ($search = trim((string) $request->query('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('default_instructions', 'like', "%{$search}%");
            });
        }

        if ($request->filled('is_active')) {
            $query->where(
                'is_active',
                filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN)
            );
        }

        $advices = $query
            ->orderBy('name')
            ->paginate(min((int) $request->query('per_page', 50), 100));

        return response()->json([
            'success' => true,
            'data' => $advices,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeSuperAdmin($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'default_instructions' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $advice = DentalAdvice::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Dental advice created successfully.',
            'data' => $advice,
        ], 201);
    }

    public function show(
        Request $request,
        DentalAdvice $advice
    ) {
        $this->authorizeSuperAdmin($request);

        return response()->json([
            'success' => true,
            'data' => $advice,
        ]);
    }

    public function update(
        Request $request,
        DentalAdvice $advice
    ) {
        $this->authorizeSuperAdmin($request);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'default_instructions' => ['sometimes', 'nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $advice->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Dental advice updated successfully.',
            'data' => $advice->fresh(),
        ]);
    }

    public function updateStatus(
        Request $request,
        DentalAdvice $advice
    ) {
        $this->authorizeSuperAdmin($request);

        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $advice->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Dental advice status updated successfully.',
            'data' => $advice->fresh(),
        ]);
    }
}