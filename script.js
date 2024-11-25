// Global variables for DOM elements
const userInput = document.getElementById('userInput');
const loadingDiv = document.getElementById('loading');
const responseDiv = document.getElementById('response');

// Main function to handle form submission
async function handleSubmit() {
    // Get the user input
    const prompt = userInput.value;

    // Input validation
    if (!prompt.trim()) {
        alert('Please enter a message');
        return;
    }

    // Show loading state
    loadingDiv.style.display = 'block';
    responseDiv.innerHTML = '';

    try {
        // Call the Netlify function
        const response = await fetch('/.netlify/functions/fetchOpenAI', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: prompt })
        });

        // Handle the response
        const data = await response.json();

        // Check if there's an error in the response
        if (data.error) {
            throw new Error(data.error);
        }

        // Display the response
        if (data.choices && data.choices[0]) {
            responseDiv.innerHTML = data.choices[0].message.content;
        } else {
            responseDiv.innerHTML = 'Received an unexpected response format';
        }

    } catch (error) {
        // Handle any errors
        console.error('Error:', error);
        responseDiv.innerHTML = `Error: ${error.message || 'Unable to fetch response'}`;
    } finally {
        // Hide loading state
        loadingDiv.style.display = 'none';
    }
}

// Function to clear the input and response
function clearAll() {
    userInput.value = '';
    responseDiv.innerHTML = '';
}

// Function to handle Enter key press
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSubmit();
    }
}

// Function to initialize event listeners
function initEventListeners() {
    // Add event listener for Enter key
    userInput.addEventListener('keypress', handleKeyPress);

    // Optional: Add event listener for input changes
    userInput.addEventListener('input', () => {
        // You can add real-time validation or character counting here
        if (userInput.value.length > 1000) {
            userInput.value = userInput.value.substring(0, 1000);
            alert('Maximum input length is 1000 characters');
        }
    });

    // Clear button functionality (if you add a clear button in HTML)
    const clearButton = document.getElementById('clearButton');
    if (clearButton) {
        clearButton.addEventListener('click', clearAll);
    }
}

// Function to display a message in the response area
function displayMessage(message) {
    responseDiv.innerHTML = message;
}

// Function to handle API errors
function handleApiError(error) {
    console.error('API Error:', error);
    displayMessage(`Error: ${error.message || 'Unable to fetch response'}`);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
});

// Export functions for use in other files if needed
export {
    handleSubmit,
    clearAll,
    handleKeyPress,
    displayMessage,
    handleApiError
};
