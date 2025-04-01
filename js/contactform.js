document.getElementById("contactform").addEventListener("submit", function(event) {
    event.preventDefault(); // Prevent the default form submission behavior

    const scriptURL = "https://script.google.com/macros/s/AKfycbwdEZCkWwnVvapWLri0zV1q-Xky_AEXB5Fp5KaaS7VlFFRheIpC8Ni4P7pUIZEoevPk/exec";

    // Create a FormData object from the form
    const formData = new FormData(event.target);

    // Use fetch to send the form data
    fetch(scriptURL, {
        method: "POST",
        body: formData,
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Check for success and show only the message
        if (data.success) {
            // Show success message
            alert("Mensaje enviado!"); // Show "Mensaje enviado!" message
            
            // Redirect after a short delay
            setTimeout(function() {
                window.location.href = 'https://www.tanwebstudio.website/'; // Redirect to homepage
            }, 1000); // Redirect after 1 second
        } else {
            alert(data.message); // Show the error message from the server
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("An error occurred. Please try again.");
    });
});
