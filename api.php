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

	public function scan(){
		$scan = [];
		if(isset($this->Settings['plugins']['conversations']['status']) && $this->Settings['plugins']['conversations']['status']){
			$scan['conversations'] = $this->Auth->query('SELECT * FROM `conversations` WHERE `meta` LIKE ? AND `hasNew` = ?','%TR:%','true')->fetchAll()->all();
		}
		if(isset($this->Settings['plugins']['messages']['status']) && $this->Settings['plugins']['messages']['status']){
			$scan['messages'] = $this->Auth->query('SELECT * FROM `messages` WHERE `meta` LIKE ?','%TR:%')->fetchAll()->all();
		}
		foreach($scan as $table => $records){
			if(!empty($records)){
				foreach($records as $record){
					// Assemble Meta Data
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
					// Lookup for Organizations
					$organization = $this->Auth->query('SELECT * FROM `organizations` WHERE `setCodeHVS` LIKE ? OR `setCodeLVS` LIKE ?','%'.(substr(str_replace('-','',$metaData['transaction_number']), 0, 5)).'%','%'.(substr(str_replace('-','',$metaData['transaction_number']), 0, 5)).'%')->fetchAll()->all();
					if(!empty($organization)){
						$organization = $organization[0];
						// Lookup for existing B3
						$b3 = $this->Auth->query('SELECT * FROM `b3` WHERE `transaction_number` = ?',$metaData['transaction_number'])->fetchAll()->all();
						// Create/Update B3
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
								],true);
							}
							$action = "Creating";
						}
						// Load Relationships
						$relationships = $this->getRelationships('b3',$b3['id']);
						$lastID = 0;
						foreach($relationships as $id => $relationship){
							if($lastID < $id){ $lastID = $id; }
							foreach($relationship as $relation){
								if($relation['relationship'] == 'messages'){
									$message = $this->Auth->query('SELECT * FROM `messages` WHERE `id` = ?',$relation['link_to'])->fetchAll()->all();
									if(!empty($message)){
										$message = $message[0];
										$meta = json_decode($message['meta'], true);
										if(!in_array('scanB3',$meta)){
											array_push($meta,'scanB3');
											$message['meta'] = json_encode($meta, JSON_PRETTY_PRINT);
											$this->Auth->update('messages',$message,$message['id']);
											$current = $b3['status'];
											if(strpos($message['to'], 'create@') !== false && $current < 4){$b3['status'] = 3;}
											if(strpos($message['to'], 'reject@') !== false && $current < 4){$b3['status'] = 4;}
											if(strpos($message['to'], 'release@') !== false && $current < 6){$b3['status'] = 6;}
											if(strpos($message['to'], 'billed@') !== false && $current < 9){$b3['status'] = 9;}
											if(strpos($message['to'], 'done@') !== false && $current < 11){$b3['status'] = 11;}
											if(strpos($message['to'], 'cancel@') !== false && $current < 12){$b3['status'] = 12;}
											if(isset($this->Settings['debug']) && $this->Settings['debug'] && $current != $b3['status']){ echo "[".$message['to']."]"."[".$b3['transaction_number']."] changing status from: ".$current." to: ".$b3['status']."\n"; }
											if($current != $b3['status']){
												$status = $this->Auth->query('SELECT * FROM `statuses` WHERE `relationship` = ? AND `order` = ?','b3',$b3['status'])->fetchAll()->all();
												if(!empty($status)){
													$this->createRelationship([
														'relationship_1' => 'b3',
														'link_to_1' => $b3['id'],
														'relationship_2' => 'statuses',
														'link_to_2' => $status[0]['id'],
													],true);
												}
											}
										}
									}
								}
							}
						}
						// Link the Organization
						$this->createRelationship([
							'relationship_1' => 'b3',
							'link_to_1' => $b3['id'],
							'relationship_2' => 'organizations',
							'link_to_2' => $organization['id'],
						]);
						// Copy Relationship from record
						$this->copyRelationships($table,$record['id'],'b3',$b3['id']);
						// Reload Relationships
						$relationships = $this->getRelationships('b3',$b3['id']);
						$newID = 0;
						foreach($relationships as $id => $relationship){
							if($newID < $id){ $newID = $id; }
						}
						// Display if B3 was updated
						if($lastID < $newID){
							if(isset($record['hasNew']) && in_array($table,['conversations'])){
								$record['hasNew'] = '';
								$this->Auth->update($table,$record,$record['id']);
								if(isset($this->Settings['debug']) && $this->Settings['debug']){ echo "[".$table."] Updating record: [".$record['id']."]\n"; }
							}
							$this->Auth->update('b3',$b3,$b3['id']);
							if(isset($this->Settings['debug']) && $this->Settings['debug']){ echo "[".$newID."]".$action." B3: ".$metaData['transaction_number']."\n"; }
						}
						//
					} else {
						if(isset($this->Settings['debug']) && $this->Settings['debug']){ echo "Unable to find organization with [setCodeHVS] or [setCodeLVS] of: ".(substr(str_replace('-','',$metaData['transaction_number']), 0, 5))."\n"; }
					}
				}
			}
		}
	}
}
