<?php
include_once 'liglabAPI.php';

$ligLabApi = new LigLabApi;	    	    

if(isset($_POST["formula"])){
	echo $ligLabApi->proveFormula($_POST["formula"]);
}
?>

<html>
    <head>
		<title>ND Tester</title>
    </head>
	<body>
		<form action="index.php" method="post">
			<input name="formula" type="text" placeholder="formula here">
			</br>
			<input name="submit" type="submit">
		</form>
    </body>     
</html>