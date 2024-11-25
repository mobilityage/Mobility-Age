// Global object to track assessment data
let assessmentData = {
  userAge: null,
  currentPose: 0, // Index to track the current pose being assessed
  poses: [
    { name: 'Wall Angel', mobilityAge: null, analysis: null, exercises: null },
    { name: 'Forward Fold', mobilityAge: null, analysis: null, exercises: null },
    { name: 'Deep Squat', mobilityAge: null, analysis: null, exercises: null },
    { name: 'Side Bend', mobilityAge: null, analysis: null, exercises: null },
  ],
};

// Function to update the displayed current pose
function updatePoseDisplay() {
  const poseDisplay = document.getElementById("pose-display");
  poseDisplay.textContent = `Current Pose: ${assessmentData.poses[assessmentData.currentPose].name}`;
}

// Function to analyze an image using the OpenAI API through a Netlify function
async function analyzeImageWithAI(imageBase64) {
  try {
    const base64Data = imageBase64.split(",")[1]; // Remove "data:image/png;base64," prefix
    const currentPose = assessmentData.poses[assessmentData.currentPose].name;

    // Build the request body for OpenAI API
    const requestBody = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Analyze the user's ${currentPose} form and provide feedback.`,
        },
        // Image is represented as raw base64 data
        {
          image: base64Data,
        },
      ],
    };

    // Send the request to the Netlify function
    const response = await fetch("/.netlify/functions/fetchOpenAI", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    // Parse and return the response from OpenAI
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error; // Rethrow error to display it in the UI
  }
}

// Function to handle image upload
function handleImageUpload(event) {
  const file = event.target.files[0];

  if (!file) {
    alert("Please upload an image.");
    return;
  }

  const reader = new FileReader();

  reader.onload = async function () {
    const imageBase64 = reader.result;

    try {
      // Call the analysis function
      const analysis = await analyzeImageWithAI(imageBase64);

      // Update the current pose data with the analysis
      assessmentData.poses[assessmentData.currentPose].analysis = analysis;

      // Display results in the UI
      const resultsDiv = document.getElementById("results");
      resultsDiv.innerHTML = `
        <h3>${assessmentData.poses[assessmentData.currentPose].name} Analysis</h3>
        <pre>${JSON.stringify(analysis, null, 2)}</pre>
      `;
    } catch (error) {
      // Display error in the UI
      alert("An error occurred while analyzing the image. Please try again.");
    }
  };

  reader.readAsDataURL(file); // Convert the image file to a Base64 string
}

// Function to handle moving to the next pose
function nextPose() {
  if (assessmentData.currentPose < assessmentData.poses.length - 1) {
    assessmentData.currentPose++;
    updatePoseDisplay();
  } else {
    alert("You have completed all the poses!");
  }
}

// Function to handle moving to the previous pose
function previousPose() {
  if (assessmentData.currentPose > 0) {
    assessmentData.currentPose--;
    updatePoseDisplay();
  } else {
    alert("You are already on the first pose.");
  }
}

// Event listeners for UI buttons and file input
document.addEventListener("DOMContentLoaded", function () {
  const uploadInput = document.getElementById("image-upload");
  const nextButton = document.getElementById("next-pose");
  const prevButton = document.getElementById("previous-pose");

  uploadInput.addEventListener("change", handleImageUpload);
  nextButton.addEventListener("click", nextPose);
  prevButton.addEventListener("click", previousPose);

  // Initialize pose display
  updatePoseDisplay();
});
