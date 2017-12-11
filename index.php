<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!-- The above 3 meta tags *must* come first in the head; any other head content must come *after* these tags -->
    <title>NatDud</title>

    <!-- Bootstrap (https://github.com/twbs/bootstrap) -->
    <link href="css/bootstrap.min.css" rel="stylesheet">
	<!-- Custom NatDud CSS -->
	<link href="css/NatDud.css" rel="stylesheet">
	<!-- jQuery (necessary for Bootstrap's JavaScript plugins) -->
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script>
	<!-- jQuery UI (used for animation and manipulation of UI) -->
	<script src="http://code.jquery.com/ui/1.9.1/jquery-ui.js" type="text/javascript"></script>
    <!-- Include all compiled plugins (below), or include individual files as needed -->
    <script src="js/bootstrap.min.js"></script>
	<script>$(document).ready(function(){$('#main-content').fadeIn("slow");});</script>
  </head>

  <body>
	<div id="main-content">
		<div class="title-area" id="title-area">
		</div>
		
		<div class="formulaproof" id="formulaproof">
			<label class="error-message" id="error-message" style="margin-bottom:margin-left: 1rem; color:#bb0000"></label>
			<div class="formula-input-area" id="formula-input-area">
				<input type="text" id="formula" class="form-control form-rounded input-lg" placeholder="Logic Formula">
			</div>
			
			<div class="logic-button-area" id="logic-button-area">
				<button class="btn btn-info" id="logic-and"><span class="glyphicon glyphicon-chevron-up"></span></button>
				<button class="btn btn-info" id="logic-or"><span class="glyphicon glyphicon-chevron-down"></span></button>
				<button class="btn btn-info" id="logic-imply"><span class="glyphicon glyphicon-arrow-right"></span></button>
				<button class="btn btn-info" id="logic-not"><span class="glyphicon glyphicon-ok gly-rotate-tick-not"></span></button>
			</div>
			
			<div class="submit-button-area" id="submit-button-area">
				<button class="btn btn-success" id="logic-submit"><span class="glyphicon glyphicon-ok"></span></button>
			</div>
		</div>
		
		<div class="proof-input-area" id="proof-input-area">
			<div class="proof-area" id="proof-area">
			</div>
			<div class="proof-buttons" id="proof-buttons">
			</div>
		</div>
		
		<div class="text-block-area">
			<h1>NatDud</h1>
			<p>a natural deduction checking platform</p>
		</div>
	</div>
	
	<!-- Custom Scripts -->
	<script src="js/proofInput.js"></script>
  </body>
</html>