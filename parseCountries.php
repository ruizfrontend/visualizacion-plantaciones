<?php


	// inputs
$csvPaises = 'paises3.csv';
$jsonCapitales = 'country-capitals.json';

	// putput
$outpPaises = 'paises.json';



	// carga el archivo de geoposiciones de capitales
$capitalesBase = json_decode(file_get_contents($jsonCapitales), true);
	// genera un diccionario de paises y sus datos
foreach ($capitalesBase as $key => $value) {
	$capitales[$value['CountryName']] = $value;
}

	// carga paises de Raul y pinta las geoposiciones
$capitales = getPaises($csvPaises, $capitales);

// print_R($capitales); die();

	// escupe los paises sin geoposición y los metemos a manos
file_put_contents($outpPaises, json_encode($capitalesFix));



function getPaises($csvPaises, $capitales) {

	ini_set("auto_detect_line_endings", true);

	$outp = array();

	$fila = 0;
	if (($gestor = fopen($csvPaises, "r")) !== FALSE) {
	    while (($datos = fgetcsv($gestor, 10000, ";")) !== FALSE) {
	    	$fila++;

	    	if($fila < 2) continue; // || in_array($datos[0], $GLOBALS['notCountries'])) continue;

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
