<?php
class b3API extends CRUDAPI {

	public function get($request = null, $data = null){
		if(isset($data)){
			if(!is_array($data)){ $data = json_decode($data, true); }
			$this->Auth->setLimit(0);
			// Load Event
			$get = parent::get('conversations', $data);
			// Build Relations
			$get = $this->buildRelations($get);
			// Return
			return $get;
		}
	}

	public function saveB3from($type,$record){
		// Load Relationships
		$relationships = $this->getRelationships($type,$record['id']);
		$lastID = 0;
		foreach($relationships as $id => $relationship){
			if($lastID < $id){ $lastID = $id; }
		}
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
				if(isset($metaData['transaction_number'])){
					$b3 = $this->Auth->query('SELECT * FROM `b3` WHERE `transaction_number` = ?',$metaData['transaction_number'])->fetchAll()->all();
					$organization = $this->Auth->query('SELECT * FROM `organizations` WHERE `setCodeHVS` LIKE ? OR `setCodeLVS` LIKE ?',(substr(str_replace('-','',$metaData['transaction_number']), 0, 5)),(substr(str_replace('-','',$metaData['transaction_number']), 0, 5)))->fetchAll()->all();
					if(!empty($organization)){
						$organization = $organization[0];
						if(!empty($b3)){
							$b3 = $b3[0];
						} else {
							$b3ID = $this->Auth->create('b3',$metaData);
							$b3 = $this->Auth->read('b3',$b3ID)->all()[0];
						}
						$this->createRelationship([
							'relationship_1' => 'b3',
							'link_to_1' => $b3['id'],
							'relationship_2' => 'organizations',
							'link_to_2' => $organization['id'],
						]);
						$this->copyRelationships($type,$record['id'],'b3',$b3['id']);
						// Reload Relationships
						$relationships = $this->getRelationships($type,$record['id']);
						foreach($relationships as $id => $relationship){
							if($lastID < $id){
								if(isset($this->Settings['debug']) && $this->Settings['debug']){ echo "Updating B3: ".$metaData['transaction_number']."\n"; }
								break;
							}
						}
					}
				}
				break;
			default: break;
		}
	}
}
