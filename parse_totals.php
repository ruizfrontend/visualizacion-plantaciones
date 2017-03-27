<?php
	// parsea el archivo que ya teníamos paises.json y le añade los totales por años de cada pais
$jsonPaises = 'paisesTot.json';
$csvTotals = 'totales.csv';
$jsonPaisesOut = 'paisesTot.json';

$paises = json_decode(file_get_contents($jsonPaises), true);
$totals = getTotals($csvTotals);

foreach ($paises as $country => $data) {
	if(!isset($totals[$country])) {
		echo 'no encontrado' . $country;
	} else {
		$paises[$country]['resumen'] = $totals[$country];
	}
}

file_put_contents($jsonPaisesOut, json_encode($paises));
die();


function getPaises($csvPaises, $capitales) {

	ini_set("auto_detect_line_endings", true);

	$outp = array();

	$fila = 0;
	if (($gestor = fopen($csvPaises, "r")) !== FALSE) {
	    while (($datos = fgetcsv($gestor, 10000, ";")) !== FALSE) {
	    	$fila++;

	    	if($fila < 2 || in_array($datos[0], $GLOBALS['notCountries'])) continue;

	    	$outp[$datos[0]] = array(
	    		'name' => $datos[4],
	    		'cont' => $datos[2],
	    		'reg' => $datos[3],
	    	);

	    	if(isset($capitales[$datos[1]])) {
	    		$outp[$datos[0]]['lat'] = $capitales[$datos[1]]['CapitalLatitude'];
	    		$outp[$datos[0]]['lon'] = $capitales[$datos[1]]['CapitalLongitude'];
	    	} else {
	    		echo $datos[1] . PHP_EOL;
	    	}

	    }
	    fclose($gestor);
	}

	return $outp;
}


function writeProds($prods){
	foreach ($prods as $prod => $data) {
		file_put_contents($prod . '.json', json_encode($data));
	}
}


function getTotals($csvTotals) {

	$outp = array();

	$fila = 0;
	if (($gestor = fopen($csvTotals, "r")) !== FALSE) {
	    while (($datos = fgetcsv($gestor, 10000)) !== FALSE) {
	    	
	    	$fila++;
	    	if($fila < 2) continue;

	    	// print_R($datos); die();

	    	if(!isset($outp[strtolower($datos[1])])) $outp[strtolower($datos[1])] = array('exps' => array(), 'imps' => array());

	    	if($datos[3] == 'import') $outp[strtolower($datos[1])]['imps'][$datos[0]] = $datos[2];
	    	else $outp[strtolower($datos[1])]['exps'][$datos[0]] = $datos[2];

	    	// print_R($outp); die();

	    }
	    fclose($gestor);
	}

	return $outp;
}



?>