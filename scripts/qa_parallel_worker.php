<?php
require __DIR__.'/../backend/vendor/autoload.php';
$app=require __DIR__.'/../backend/bootstrap/app.php';$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
if(!str_ends_with(config('database.connections.mysql.database'),'_test')){fwrite(STDERR,"Refuse non-test database\n");exit(2);}
$job=json_decode(file_get_contents($argv[1]),true,flags:JSON_THROW_ON_ERROR);
touch($argv[2]);$deadline=microtime(true)+20;while(!file_exists($argv[3])){if(microtime(true)>$deadline)exit(3);usleep(1000);}
try{$service=app(\App\Services\ParkingService::class);if($job['operation']==='scan')$result=$service->scan(\Illuminate\Support\Facades\DB::table('devices')->where('id',1)->first(),$job['payload']);else $result=$service->topup($job['user_id'],$job['payload'],\Illuminate\Support\Facades\DB::table('scan_claims')->where('id',$job['payload']['claim_id'])->value('session_hash'));echo json_encode($result);}
catch(\Throwable $e){echo json_encode(['error'=>get_class($e),'status'=>method_exists($e,'getStatusCode')?$e->getStatusCode():500]);exit(1);}
