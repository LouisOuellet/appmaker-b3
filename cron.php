<?php

require_once dirname(__FILE__,3).'/plugins/b3/api.php';

$API = new b3API();

$cron = $API->scan();
