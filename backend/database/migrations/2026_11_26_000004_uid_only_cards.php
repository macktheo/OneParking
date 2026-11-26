<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
return new class extends Migration {
 private function balanceGuards():void {
  if(DB::getDriverName()!=='sqlite')return;
  foreach(['INSERT','UPDATE'] as $event){$name='cards_balance_'.strtolower($event);DB::unprepared('DROP TRIGGER IF EXISTS '.$name);DB::unprepared("CREATE TRIGGER $name BEFORE $event ON cards WHEN NEW.balance < 0 BEGIN SELECT RAISE(ABORT, 'negative balance'); END");}
 }
 public function up():void {Schema::table('cards',fn(Blueprint $t)=>$t->unsignedBigInteger('holder_id')->nullable()->change());$this->balanceGuards();}
 public function down():void {if(DB::table('cards')->whereNull('holder_id')->exists())throw new RuntimeException('UID-only cards exist; rollback requires assigning holders first. No data removed.');Schema::table('cards',fn(Blueprint $t)=>$t->unsignedBigInteger('holder_id')->nullable(false)->change());$this->balanceGuards();}
};