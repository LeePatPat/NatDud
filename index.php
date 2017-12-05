<?php
include_once 'liglabAPI.php';

if(isset($_POST["formula"])){
	echo proveFormula($_POST["formula"]);
}
?>

<!DOCTYPE html>
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