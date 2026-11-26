<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class Rupiah implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_int($value) || $value < 1 || $value > 100000000) {
            $fail('Nominal wajib integer rupiah positif, maksimal Rp100.000.000.');
        }
    }
}
