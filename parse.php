<?php

	// nombres de archivos
$csvProductos = 'cinco_productos.csv';
$outFolder = './demo/';

	// agrupación de ids de producto y producto real
$productFix = array(
	'080300' => 'banana',

	'090111' => 'cafe',
	'090112' => 'cafe',
	'090121' => 'cafe',
	'090122' => 'cafe',
	'090190' => 'cafe',

	'170111' => 'azucar',
	'170112' => 'azucar',
	'170191' => 'azucar',
	'170199' => 'azucar',

	'151110' => 'aceite',
	'151190' => 'aceite',

	'180100' => 'cacao'
);


	// carga el csv de productos
$prods = getProds($csvProductos);
	
	// descompone los datos de productos en jsones
writeProds($prods);



function writeProds($prods){
	foreach ($prods as $prod => $data) {
		file_put_contents($GLOBALS['outFolder'] . $prod . '.json', json_encode($data));
	}
}


function getProds($csvProductos) {

	$outp = array();

	$fila = 0;
	if (($gestor = fopen($csvProductos, "r")) !== FALSE) {
	    while (($datos = fgetcsv($gestor, 10000, ";")) !== FALSE) {
	    	$fila++;
	    	if($fila < 2) continue;
	    	// if($fila > 10000) { print_R($outp); die();}

	    	$year = $datos[0];
	    	$origen = $datos[1];
	    	$dest = $datos[2];
	    	$prod = $GLOBALS['productFix'][$datos[3]];
	    	$exp = $datos[4];
	    	$imp = $datos[5];

	    	if($exp == 'NULL') continue;
	    	// if(in_array($origen, $GLOBALS['notCountries']) || in_array($dest, $GLOBALS['notCountries'])) continue;

	    	if(!isset($outp[$prod])) $outp[$prod] = array();
	    	if(!isset($outp[$prod][$year])) $outp[$prod][$year] = array();
	    	if(!isset($outp[$prod][$year][$origen])) $outp[$prod][$year][$origen] = array();
	    	if(!isset($outp[$prod][$year][$origen][$dest])) $outp[$prod][$year][$origen][$dest] = 0;

	    	$outp[$prod][$year][$origen][$dest] += intval($exp);

	    }
	    fclose($gestor);
	}

	return $outp;
}



?>