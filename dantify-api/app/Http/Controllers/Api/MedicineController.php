<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Medicine;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MedicineController extends Controller
{
    private function authorizeSuperAdmin(Request $request): void
    {
        abort_unless(
            $request->user()?->role()
                ->where('name', 'superadmin')
                ->exists(),
            403,
            'Only Super Admin can manage the medicine catalogue.'
        );
    }

    public function index(Request $request)
    {
        $this->authorizeSuperAdmin($request);

        $query = Medicine::query();

        if ($search = trim((string) $request->query('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('generic_name', 'like', "%{$search}%")
                    ->orWhere('brand_name', 'like', "%{$search}%")
                    ->orWhere('composition', 'like', "%{$search}%")
                    ->orWhere('strength', 'like', "%{$search}%");
            });
        }

        if ($request->filled('is_active')) {
            $query->where(
                'is_active',
                filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN)
            );
        }

        if ($request->filled('dosage_form')) {
            $query->where('dosage_form', $request->query('dosage_form'));
        }

        $medicines = $query
            ->orderBy('name')
            ->paginate(min((int) $request->query('per_page', 50), 100));

        return response()->json([
            'success' => true,
            'data' => $medicines,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeSuperAdmin($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'generic_name' => ['nullable', 'string', 'max:255'],
            'brand_name' => ['nullable', 'string', 'max:255'],
            'composition' => ['nullable', 'string'],
            'strength' => ['nullable', 'string', 'max:100'],
            'dosage_form' => ['nullable', 'string', 'max:100'],
            'manufacturer' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'default_instructions' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $medicine = Medicine::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Medicine created successfully.',
            'data' => $medicine,
        ], 201);
    }

    public function show(Request $request, Medicine $medicine)
    {
        $this->authorizeSuperAdmin($request);

        return response()->json([
            'success' => true,
            'data' => $medicine,
        ]);
    }

    public function update(Request $request, Medicine $medicine)
    {
        $this->authorizeSuperAdmin($request);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'generic_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'brand_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'composition' => ['sometimes', 'nullable', 'string'],
            'strength' => ['sometimes', 'nullable', 'string', 'max:100'],
            'dosage_form' => ['sometimes', 'nullable', 'string', 'max:100'],
            'manufacturer' => ['sometimes', 'nullable', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'default_instructions' => ['sometimes', 'nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $medicine->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Medicine updated successfully.',
            'data' => $medicine->fresh(),
        ]);
    }

    public function updateStatus(Request $request, Medicine $medicine)
    {
        $this->authorizeSuperAdmin($request);

        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $medicine->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Medicine status updated successfully.',
            'data' => $medicine->fresh(),
        ]);
    }
}