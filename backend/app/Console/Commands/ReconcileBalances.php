<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ReconcileBalances extends Command
{
    protected $signature = 'parking:reconcile';

    protected $description = 'Check every balance against immutable ledger';

    public function handle(): int
    {
        $fail = 0;
        foreach (DB::table('cards')->get() as $c) {
            $sum = DB::table('transactions')->where('card_id', $c->id)->selectRaw("COALESCE(SUM(CASE WHEN type='TOPUP' THEN amount ELSE -CAST(amount AS SIGNED) END),0) AS expected")->first();
            if ((int) $sum->expected !== (int) $c->balance) {
                $fail++;
                $this->error('Mismatch card id '.$c->id);
            }
        }$this->info($fail ? 'FAIL: '.$fail.' mismatch' : 'PASS: all balances match ledger');

        return $fail ? 1 : 0;
    }
}
