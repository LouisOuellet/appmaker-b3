<?php
class b3API extends CRUDAPI {

	public function saveB3from($type,$record){
		// Load Relationships
		$relationships = $this->getRelationships($type,$record['id']);
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
				$b3 = $this->Auth->query('SELECT * FROM `b3` WHERE `transaction_number` = ?',$metaData['transaction_number'])->fetchAll()->all();
				if(!empty($b3)){
					$b3 = $b3[0];
				} else {
					$b3ID = $this->Auth->create('b3',$b3);
					$b3 = $this->Auth->read('b3',$b3ID)->all()[0];
				}
				$this->copyRelationships($type,$record['id'],'b3',$b3['id']);
				break;
			default: break;
		}
	}
}
