<?php

	// nombres de archivos
$csvProductos = 'cinco_productos.csv';
$csvPaises = 'paises3.csv';
$jsonCapitales = 'country-capitals.json';

	// paises de los que paso 100%
$notCountries = array('umi', 'pci', 'wld', 'xxb');


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
// $prods = getProds($csvProductos);
	
	// descompone los datos de productos en jsones
// writeProds($prods);


	// carga el archivo de geoposiciones de capitales
$capitalesBase = json_decode(file_get_contents($jsonCapitales), true);
	// genera un diccionario de paises y sus datos
foreach ($capitalesBase as $key => $value) {
	$capitales[$value['CountryName']] = $value;
}
// print_R($capitales); die();

	// carga paises de Raul y pinta las geoposiciones
	// escupe los paises sin geoposición y los metemos a manos
file_put_contents('paises.json', json_encode(getPaises($csvPaises, $capitales)));



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
	    	if(in_array($origen, $GLOBALS['notCountries']) || in_array($dest, $GLOBALS['notCountries'])) continue;

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