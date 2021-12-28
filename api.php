<?php
class b3API extends CRUDAPI {

	public function get($request = null, $data = null){
		if(isset($data)){
			if(!is_array($data)){ $data = json_decode($data, true); }
			$this->Auth->setLimit(0);
			// Load Event
			$get = parent::get('b3', $data);
			// Build Relations
			$get = $this->buildRelations($get);
			// Return
			return $get;
		}
	}

	public function saveB3from($type,$record){
		// Handling types of records
		switch($type){
			case"conversations":
				$metaData = [];
				foreach(json_decode($record['meta'], true) as $meta){
					$metaPart = explode(":",$meta);
					switch($metaPart[0]){
						case"PO":
							$metaData['po_num'] = $metaPart[1];
							break;
						case"INV":
							$metaData['invoice_number'] = $metaPart[1];
							break;
						case"CN":
							$metaData['container_numbers'] = $metaPart[1];
							break;
						case"CCN":
							$metaData['cargo_control_number'] = $metaPart[1];
							break;
						case"TR":
							$metaData['transaction_number'] = $metaPart[1];
							break;
						default: break;
					}
				}
				break;
			default: break;
		}
		$b3 = $this->Auth->query('SELECT * FROM `b3` WHERE `transaction_number` = ?',$metaData['transaction_number'])->fetchAll()->all();
		$organization = $this->Auth->query('SELECT * FROM `organizations` WHERE `setCodeHVS` LIKE ? OR `setCodeLVS` LIKE ?',(substr(str_replace('-','',$metaData['transaction_number']), 0, 5)),(substr(str_replace('-','',$metaData['transaction_number']), 0, 5)))->fetchAll()->all();
		if(!empty($organization)){
			$organization = $organization[0];
			if(!empty($b3)){
				$b3 = $b3[0];
				$action = "Updating";
			} else {
				$metaData['status'] = 1;
				$b3ID = $this->Auth->create('b3',$metaData);
				$b3 = $this->Auth->read('b3',$b3ID)->all()[0];
				$status = $this->Auth->query('SELECT * FROM `statuses` WHERE `relationship` = ? AND `order` = ?','b3',$b3['status'])->fetchAll()->all();
				if(!empty($status)){
					$this->createRelationship([
						'relationship_1' => 'b3',
						'link_to_1' => $b3['id'],
						'relationship_2' => 'statuses',
						'link_to_2' => $status[0]['id'],
					]);
				}
				$action = "Creating";
			}
			// Load Relationships
			$relationships = $this->getRelationships('b3',$b3['id']);
			$lastID = 0;
			foreach($relationships as $id => $relationship){
				if($lastID < $id){ $lastID = $id; }
			}
			$this->createRelationship([
				'relationship_1' => 'b3',
				'link_to_1' => $b3['id'],
				'relationship_2' => 'organizations',
				'link_to_2' => $organization['id'],
			]);
			$this->copyRelationships($type,$record['id'],'b3',$b3['id']);
			// Reload Relationships
			$relationships = $this->getRelationships('b3',$b3['id']);
			$newID = 0;
			foreach($relationships as $id => $relationship){
				if($newID < $id){ $newID = $id; }
				foreach($relationship as $relation){
					if($relation['relationship'] == 'messages'){
						$updated = false;
						$message = $this->Auth->read('messages',$relation['link_to'])->all()[0];
						foreach(explode(';',trim($message['to'],';')) as $to){
							if(strpos($to, 'created@') !== false){ $b3['status'] = 2;$updated = true;}
							if(strpos($to, 'reject@') !== false){ $b3['status'] = 3;$updated = true;}
							if(strpos($to, 'release@') !== false){ $b3['status'] = 4;$updated = true;}
							if(strpos($to, 'billed@') !== false){ $b3['status'] = 7;$updated = true;}
							if(strpos($to, 'done@') !== false){ $b3['status'] = 9;$updated = true;}
							if(isset($this->Settings['debug']) && $this->Settings['debug']){ echo "[".$b3['transaction_number']."]"."Updating B3's status: ".$b3['status']."\n"; }
						}
						if($updated){
							$status = $this->Auth->query('SELECT * FROM `statuses` WHERE `relationship` = ? AND `order` = ?','b3',$b3['status'])->fetchAll()->all();
							if(!empty($status)){
								$this->createRelationship([
									'relationship_1' => 'b3',
									'link_to_1' => $b3['id'],
									'relationship_2' => 'statuses',
									'link_to_2' => $status[0]['id'],
								]);
								$this->Auth->update('b3',$b3,$b3['id']);
								if(isset($this->Settings['debug']) && $this->Settings['debug']){ echo "[".$b3['transaction_number']."]"."Updated\n"; }
							}
						}
					}
				}
			}
			if($lastID < $newID){
				if(isset($this->Settings['debug']) && $this->Settings['debug']){ echo "[".$newID."]".$action." B3: ".$metaData['transaction_number']."\n"; }
			}
		} else {
			if(isset($this->Settings['debug']) && $this->Settings['debug']){ echo "Unable to find organization with [setCodeHVS] or [setCodeLVS] of: ".(substr(str_replace('-','',$metaData['transaction_number']), 0, 5))."\n"; }
		}
	}
}
