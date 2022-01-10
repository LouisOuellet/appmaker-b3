<?php
class b3API extends CRUDAPI {

	public function read($request = null, $data = null){
		if(isset($data)){
			if(!is_array($data)){ $data = json_decode($data, true); }
			$this->Auth->setLimit(0);
			// Load B3s
			$B3s = parent::read('b3', $data);
			// Return
			return $B3s;
		}
	}

	public function get($request = null, $data = null){
		if(isset($data)){
			if(!is_array($data)){ $data = json_decode($data, true); }
			$this->Auth->setLimit(0);
			// Load B3
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
			$scan['conversations'] = $this->Auth->query('SELECT * FROM `conversations` WHERE `meta` LIKE ? AND `hasNew` = ? AND `status` = ?','%TR:%','true',1)->fetchAll()->all();
		}
		foreach($scan as $table => $records){
			if(!empty($records)){
				if(isset($this->Settings['debug']) && $this->Settings['debug']){ echo "[".count($records)."] conversations to scan\n"; }
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
								$metaData['ci_num'] = $metaPart[1];
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
							case"MWB":
								$metaData['mwb'] = $metaPart[1];
								break;
							case"PKG":
								$metaData['num_pkg'] = $metaPart[1];
								break;
							case"WEIGHT":
								$metaData['gross_weight'] = $metaPart[1];
								break;
							case"CLIENT":
								$metaData['b3_client_code'] = $metaPart[1];
								break;
							case"VENDOR":
								$metaData['vendor_code'] = $metaPart[1];
								break;
							case"BILLING":
								$metaData['invoice_number'] = $metaPart[1];
								break;
							case"CROSSING":
								$metaData['customs_office'] = $metaPart[1];
								break;
							case"LOCATION":
								$metaData['location_of_goods'] = $metaPart[1];
								break;
							case"SBNR":
								$metaData['client_sbnr'] = $metaPart[1];
								break;
							default: break;
						}
					}
					// Lookup for Organizations
					if(isset($metaData['transaction_number'])){
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
							if($b3['status'] < 11){
								$current = $b3['status'];
								// Load Relationships
								$relationships = $this->getRelationships('b3',$b3['id']);
								$lastID = 0;
								foreach($relationships as $id => $relationship){ if($lastID < $id){ $lastID = $id; } }
								// Link the Organization
								$this->createRelationship([
									'relationship_1' => 'b3',
									'link_to_1' => $b3['id'],
									'relationship_2' => 'organizations',
									'link_to_2' => $organization['id'],
								]);
								// Link the record
								$this->createRelationship([
									'relationship_1' => 'b3',
									'link_to_1' => $b3['id'],
									'relationship_2' => $table,
									'link_to_2' => $record['id'],
								]);
								// Copy Relationship from record
								$this->copyRelationships($table,$record['id'],'b3',$b3['id']);
								// Reload Relationships
								$relationships = $this->getRelationships('b3',$b3['id']);
								// Updating B3
								foreach($relationships as $id => $relationship){
									foreach($relationship as $relation){
										if($relation['relationship'] == 'messages'){
											// Updating B3 based on messages
											$message = $this->Auth->query('SELECT * FROM `messages` WHERE `id` = ?',$relation['link_to'])->fetchAll()->all();
											if(!empty($message)){
												$message = $message[0];
												if($message['meta'] != '' && $message['meta'] != null && !is_array($message['meta'])){
													$message['meta'] = json_decode($message['meta'], true);
												} else { $message['meta'] = []; }
												if(!in_array('scanB3',$message['meta'])){
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
													array_push($message['meta'],'scanB3');
													$message['meta'] = json_encode($message['meta'], JSON_PRETTY_PRINT);
													$this->Auth->update('messages',$message,$message['id']);
													if(isset($this->Settings['debug']) && $this->Settings['debug']){ echo "[".$message['id']."] Message tagged!\n"; }
												}
											}
										}
									}
								}
								// Check if B3 was updated
								$relationships = $this->getRelationships('b3',$b3['id']);
								$newID = 0;
								foreach($relationships as $id => $relationship){ if($newID < $id){ $newID = $id; } }
								// Display if B3 was updated
								if($lastID < $newID){
									$this->Auth->update('b3',$b3,$b3['id']);
									if(isset($this->Settings['debug']) && $this->Settings['debug']){ echo "[".$newID."]".$action." B3: ".$metaData['transaction_number']."\n"; }
								}
							}
							// Closing open conversations
							if($table == 'conversations'){
								if($b3['status'] >= 11){
									$conversation = $this->Auth->query('SELECT * FROM `conversations` WHERE `id` = ? AND `status` = ?',$record['id'],1)->fetchAll()->all();
									if(!empty($conversation)){
										$conversation = $conversation[0];
										$conversation['status'] = 3;
										$status = $this->Auth->query('SELECT * FROM `statuses` WHERE `relationship` = ? AND `order` = ?','conversations',$conversation['status'])->fetchAll()->all();
										if(!empty($status)){
											$this->createRelationship([
												'relationship_1' => 'conversations',
												'link_to_1' => $record['id'],
												'relationship_2' => 'statuses',
												'link_to_2' => $status[0]['id'],
											]);
											$this->Auth->update('conversations',$conversation,$conversation['id']);
											if(isset($this->Settings['debug']) && $this->Settings['debug']){ echo "[".$conversation['id']."] Conversation Closed!\n"; }
										}
									}
								}
							}
						} else {
							if(isset($this->Settings['debug']) && $this->Settings['debug']){ echo "Unable to find organization with [setCodeHVS] or [setCodeLVS] of: ".(substr(str_replace('-','',$metaData['transaction_number']), 0, 5))."\n"; }
						}
					}
				}
			}
		}
	}
}
