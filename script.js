let assessmentData = {
  userAge: null,
  currentPose: 0,
  poses: [
      { name: 'Wall Angel', mobilityAge: null, analysis: null, exercises: null },
      { name: 'Forward Fold', mobilityAge: null, analysis: null, exercises: null },
      { name: 'Deep Squat', mobilityAge: null, analysis: null, exercises: null },
      { name: 'Side Bend', mobilityAge: null, analysis: null, exercises: null }
  ]
};

const startButton = document.getElementById('startAssessment');
const ageSection = document.getElementById('ageSection');
const poseInstructionSection = document.getElementById('poseInstructionSection');
const uploadSection = document.getElementById('uploadSection');
const takePhotoBtn = document.getElementById('takePhoto');
const uploadButton = document.getElementById('uploadButton');
const photoUpload = document.getElementById('photoUpload');
const cameraInput = document.getElementById('cameraInput');
const previewContainer = document.getElementById('previewContainer');
const photoPreview = document.getElementById('photoPreview');
const confirmPhoto = document.getElementById('confirmPhoto');
const retakePhoto = document.getElementById('retakePhoto');
const loadingScreen = document.getElementById('loadingScreen');
const resultsSection = document.getElementById('resultsSection');
const nextPose = document.getElementById('nextPose');
const viewFinalResults = document.getElementById('viewFinalResults');
const finalResultsSection = document.getElementById('finalResultsSection');

let currentPhotoData = null;

function showCurrentPose() {
  const currentPoseName = document.getElementById('currentPoseName');
  currentPoseName.textContent = assessmentData.poses[assessmentData.currentPose].name;
}

async function analyzeImageWithAI(imageBase64) {
  try {
      const base64Data = imageBase64.split(',')[1];
      const currentPose = assessmentData.poses[assessmentData.currentPose].name;

      const requestBody = {
          model: "gpt-4o-mini",
          messages: [
              {
                  role: "user",
                  content: `I am performing a ${currentPose} test. Please analyze my form and return a JSON object containing: {
                      "analysis": [3 specific observations about form],
                      "mobilityAge": estimated mobility age as a number,
                      "exercises": [
                          {
                              "name": "exercise name",
                              "description": "brief description",
                              "steps": ["step1", "step2", "step3"],
                              "frequency": "how often to do it",
                              "tips": ["tip1", "tip2", "tip3"]
                          }
                      ] (2 exercises total)
                  }`
              },
              {
                  type: "image_url",
                  image_url: {
                      url: `data:image/jpeg;base64,${base64Data}`
                  }
              }
          ],
          temperature: 0.7
      };

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content; // Adjust based on your API response structure
  } catch (error) {
      console.error('Analysis error:', error);
      throw error;
  }
}

function showError(message) {
  document.getElementById('analysisResult').innerHTML = `<p style="color: red;">${message}</p>`;
}

function calculateFinalMobilityAge() {
  let totalMobilityAge = 0;
  let poseCount = 0;
  for (const pose of assessmentData.poses) {
      if (pose.mobilityAge !== null) {
          totalMobilityAge += pose.mobilityAge;
          poseCount++;
      }
  }
  return poseCount > 0 ? Math.round(totalMobilityAge / poseCount) : null;
}

function showFinalResults() {
  const finalAge = calculateFinalMobilityAge();
  const finalMobilityAge = document.getElementById('finalMobilityAge');
  finalMobilityAge.textContent = finalAge;
  finalResultsSection.style.display = 'block';
}

startButton.addEventListener('click', () => {
  startButton.style.display = 'none';
  ageSection.style.display = 'block';
});

document.getElementById('submitAge').addEventListener('click', () => {
  const ageInput = document.getElementById('age');
  if (ageInput.value && ageInput.value >= 18 && ageInput.value <= 120) {
      assessmentData.userAge = parseInt(ageInput.value);
      ageSection.style.display = 'none';
      poseInstructionSection.style.display = 'block';
      showCurrentPose();
  } else {
      alert('Please enter a valid age between 18 and 120');
  }
});

document.getElementById('readyForPhoto').addEventListener('click', () => {
  poseInstructionSection.style.display = 'none';
  uploadSection.style.display = 'block';
});

uploadButton.addEventListener('click', () => photoUpload.click());
takePhotoBtn.addEventListener('click', () => cameraInput.click());

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
          photoPreview.src = e.target.result;
          currentPhotoData = e.target.result;
          previewContainer.style.display = 'block';
      };
      reader.readAsDataURL(file);
  }
}

photoUpload.addEventListener('change', handleFileSelect);
cameraInput.addEventListener('change', handleFileSelect);

retakePhoto.addEventListener('click', () => {
  previewContainer.style.display = 'none';
  currentPhotoData = null;
  photoPreview.src = '';
});

confirmPhoto.addEventListener('click', async () => {
  if (!currentPhotoData) {
      showError('No photo selected');
      return;
  }

  uploadSection.style.display = 'none';
  loadingScreen.style.display = 'block';

  try {
      const analysis = await analyzeImageWithAI(currentPhotoData);
      // Process the analysis result here
      // Update assessmentData with the analysis
  } catch (error) {
      showError(`Error: ${error.message}`);
  } finally {
      loadingScreen.style.display = 'none';
      resultsSection.style.display = 'block';
  }
});

nextPose.addEventListener('click', () => {
  resultsSection.style.display = 'none';
  assessmentData.currentPose++;
  showCurrentPose();
  poseInstructionSection.style.display = 'block';
});

viewFinalResults.addEventListener('click', showFinalResults);

document.getElementById('finalStartOver').addEventListener('click', () => {
  // Reset the assessment data and UI
});
