<?php
// parsea el archivo que ya teníamos de paises: paisesConTotales.json y nos inventamos los que no existen

$jsonPaises = 'paisesConTotales.json';
$csvProductos = 'cinco_productos.csv';

$jsonPaisesOut = './demo/paisesTot.json';


$paises = json_decode(file_get_contents($jsonPaises), true);

$fila = 0;
if (($gestor = fopen($csvProductos, "r")) !== FALSE) {
    while (($datos = fgetcsv($gestor, 10000, ";")) !== FALSE) {
    	$fila++;
    	if($fila < 2) continue;

    	$year = $datos[0];
    	$origen = $datos[1];
    	$dest = $datos[2];
    	$exp = $datos[4];
    	$imp = $datos[5];

    	if(!isset($paises[$origen])) {
    		$paises[$origen] = array(
    			"name" => $origen
    		);
    	}

    	if(!isset($paises[$dest])) {
    		$paises[$dest] = array(
    			"name" => $dest
    		);
    	}
	}
}

file_put_contents($jsonPaisesOut, json_encode($paises));