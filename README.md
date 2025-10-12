
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome Page</title>
    <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f0f8ff;
            font-family: Arial, sans-serif;
            flex-direction: column;
            text-align: center;
        }

        #welcome {
            font-size: 3em;
            color: #333;
            margin-bottom: 20px;
        }

        #startAdBtn {
            padding: 15px 30px;
            font-size: 1.5em;
            background-color: #007BFF;
            color: white;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            display: none; /* Hidden initially */
        }

        #startAdBtn:hover {
            background-color: #0056b3;
        }
    </style>
</head>
<body>

    <div id="welcome">Welcome</div>
    <button id="startAdBtn" onclick="startAd()">Start Ad</button>

    <script>
        // Show the button after 2 seconds
        setTimeout(() => {
            document.getElementById('welcome').textContent = "Welcome!";
            document.getElementById('startAdBtn').style.display = "inline-block";
        }, 2000);

        // Function when Start Ad button is clicked
        function startAd() {
            alert("Ad is starting...");
            // You can replace this with actual ad code later
        }
    </script>

</body>
</html>
