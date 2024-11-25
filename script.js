console.log(import.meta.env)
const apiKey = import.meta.env.VITE_OPENAI_API_KEY ?? '';
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
const startOverButton = document.getElementById('startOver');
const submitAge = document.getElementById('submitAge');
const readyForPhoto = document.getElementById('readyForPhoto');
const progressBar = document.getElementById('progressBar');
const poseCount = document.getElementById('poseCount');
const viewFinalResults = document.getElementById('viewFinalResults');
const finalResultsSection = document.getElementById('finalResultsSection');

let currentPhotoData = null;

function updateProgress() {
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        if (index < assessmentData.currentPose) {
            step.classList.add('completed', 'active');
        } else if (index === assessmentData.currentPose) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
    poseCount.textContent = `Pose ${assessmentData.currentPose + 1} of 4`;
}

function showCurrentPose() {
    const poseContainers = document.querySelectorAll('.pose-container');
    poseContainers.forEach((container, index) => {
        container.style.display = index === assessmentData.currentPose ? 'block' : 'none';
    });
    updateProgress();
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
                    content: [
                        { 
                            type: "text", 
                            text: `I am performing a ${currentPose} test. Please analyze my form and return a JSON object containing:
                            {
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
                    ]
                }
            ],
            temperature: 0.7
        };

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
});
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response:', data);

        const resultText = data.choices[0].message.content;
        console.log('Result text:', resultText);

        let parsedData;
        try {
            if (resultText.includes('```json')) {
                const jsonText = resultText.split('```json')[1].split('```')[0].trim();
                parsedData = JSON.parse(jsonText);
            } else {
                parsedData = JSON.parse(resultText);
            }
            return parsedData;
        } catch (error) {
            console.error('Parsing error:', error);
            return {
                analysis: [
                    "Form appears generally good",
                    "Some room for improvement noted",
                    "Continuing practice recommended"
                ],
                mobilityAge: assessmentData.userAge,
                exercises: [
                    {
                        name: "Basic Mobility Exercise",
                        description: "Fundamental movement pattern",
                        steps: ["Start position", "Execute movement", "Return to start"],
                        frequency: "Daily",
                        tips: ["Move slowly", "Maintain form"]
                    },
                    {
                        name: "Supplementary Exercise",
                        description: "Supporting movement pattern",
                        steps: ["Begin in neutral", "Perform movement", "Control return"],
                        frequency: "3x per week",
                        tips: ["Focus on control", "Stop if painful"]
                    }
                ]
            };
        }
    } catch (error) {
        console.error('Analysis error:', error);
        throw error;
    }
}

function showError(message) {
    document.getElementById('analysisResult').innerHTML = `<p style="color: red;">${message}</p>`;
    document.getElementById('exerciseRecommendations').innerHTML = 
        '<div class="exercise-item">Please try again</div>';
}

function calculateFinalMobilityAge() {
    const completedPoses = assessmentData.poses.filter(pose => pose.mobilityAge !== null);
    if (completedPoses.length === 0) return null;

    const weights = [0.3, 0.25, 0.25, 0.2];
    let totalAge = 0;
    let totalWeight = 0;

    completedPoses.forEach((pose, index) => {
        totalAge += pose.mobilityAge * weights[index];
        totalWeight += weights[index];
    });

    return Math.round(totalAge / totalWeight);
}

function showFinalResults() {
    const finalAge = calculateFinalMobilityAge();
    const finalMobilityAge = document.getElementById('finalMobilityAge');
    const poseBreakdown = document.getElementById('poseBreakdown');
    const keyRecommendations = document.getElementById('keyRecommendations');

    finalMobilityAge.textContent = finalAge;

    let breakdownHtml = assessmentData.poses.map((pose, index) => `
        <div class="pose-result">
            <h4>${pose.name}</h4>
            <p>Mobility Age: ${pose.mobilityAge}</p>
            <p>Key Observation: ${pose.analysis ? pose.analysis[0] : 'Not completed'}</p>
        </div>
    `).join('');

    poseBreakdown.innerHTML = breakdownHtml;

    let recommendationsHtml = '<div class="recommendations-list">';
    assessmentData.poses.forEach(pose => {
        if (pose.exercises) {
            recommendationsHtml += `
                <div class="exercise-item">
                    <h4>For ${pose.name}:</h4>
                    <p>${pose.exercises[0].name}</p>
                    <p>${pose.exercises[0].description}</p>
                </div>
            `;
        }
    });
    recommendationsHtml += '</div>';
    keyRecommendations.innerHTML = recommendationsHtml;

    resultsSection.style.display = 'none';
    finalResultsSection.style.display = 'block';
}

// Event Listeners
startButton.addEventListener('click', () => {
    startButton.style.display = 'none';
    ageSection.style.display = 'block';
});

submitAge.addEventListener('click', () => {
    const ageInput = document.getElementById('age');
    if (ageInput.value && ageInput.value >= 18 && ageInput.value <= 120) {
        assessmentData.userAge = parseInt(ageInput.value);
        ageSection.style.display = 'none';
        progressBar.style.display = 'block';
        poseInstructionSection.style.display = 'block';
        showCurrentPose();
    } else {
        alert('Please enter a valid age between 18 and 120');
    }
});

readyForPhoto.addEventListener('click', () => {
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

        if (analysis) {
            assessmentData.poses[assessmentData.currentPose] = {
                ...assessmentData.poses[assessmentData.currentPose],
                mobilityAge: analysis.mobilityAge,
                analysis: analysis.analysis,
                exercises: analysis.exercises
            };

            const analysisResult = document.getElementById('analysisResult');
            analysisResult.innerHTML = `
                <div class="score-section">
                    <h4>Current Mobility Age: ${analysis.mobilityAge}</h4>
                    <p class="age-comparison">
                        ${analysis.mobilityAge > assessmentData.userAge ? 
                            `Your mobility is indicating an older age than your actual age. Let's work on improving this!` :
                            `Great news! Your mobility is younger than your actual age.`}
                    </p>
                </div>
                <div class="observations">
                    ${analysis.analysis.map(obs => `<p>${obs}</p>`).join('')}
                </div>
            `;

            const recommendations = document.getElementById('exerciseRecommendations');
            recommendations.innerHTML = analysis.exercises
                .map(exercise => `
                    <div class="exercise-item">
                        <h4>${exercise.name}</h4>
                        <p>${exercise.description}</p>
                        <div class="exercise-steps">
                            <h5>Steps:</h5>
                            <ol>
                                ${exercise.steps.map(step => `<li>${step}</li>`).join('')}
                            </ol>
                        </div>
                        <div class="exercise-frequency">${exercise.frequency}</div>
                        <div class="exercise-tips">
                            <h5>Tips:</h5>
                            <ul>
                                ${exercise.tips.map(tip => `<li>${tip}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                `).join('');

            if (assessmentData.currentPose < 3) {
                nextPose.style.display = 'block';
                viewFinalResults.style.display = 'none';
            } else {
                nextPose.style.display = 'none';
                viewFinalResults.style.display = 'block';
            }
        }
    } catch (error) {
        showError(`Error: ${error.message}`);
    } finally {
        loadingScreen.style.display = 'none';
        resultsSection.style.display = 'block';
    }
});

nextPose.addEventListener('click', () => {
    resultsSection.style.display = 'none';
    previewContainer.style.display = 'none';
    currentPhotoData = null;
    photoPreview.src = '';
    assessmentData.currentPose++;
    showCurrentPose();
    poseInstructionSection.style.display = 'block';
});

viewFinalResults.addEventListener('click', showFinalResults);

[startOverButton, document.getElementById('finalStartOver')].forEach(button => {
    button.addEventListener('click', () => {
        [resultsSection, loadingScreen, uploadSection, poseInstructionSection, 
         ageSection, previewContainer, finalResultsSection, progressBar]
        .forEach(el => el.style.display = 'none');

        assessmentData = {
            userAge: null,
            currentPose: 0,
            poses: [
                { name: 'Wall Angel', mobilityAge: null, analysis: null, exercises: null },
                { name: 'Forward Fold', mobilityAge: null, analysis: null, exercises: null },
                { name: 'Deep Squat', mobilityAge: null, analysis: null, exercises: null },
                { name: 'Side Bend', mobilityAge: null, analysis: null, exercises: null }
            ]
        };

        startButton.style.display = 'block';
        photoPreview.src = '';
        currentPhotoData = null;
    });
});
