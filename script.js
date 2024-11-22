let assessmentData = {
    userAge: null,
    currentPose: 0,
    date: new Date().toISOString(),
    poses: [
        { name: 'Apley Scratch Test', mobilityAge: null, analysis: null, exercises: null, technicalDetails: null },
        { name: 'Forward Fold', mobilityAge: null, analysis: null, exercises: null, technicalDetails: null },
        { name: 'Deep Squat', mobilityAge: null, analysis: null, exercises: null, technicalDetails: null },
        { name: 'Side Bend', mobilityAge: null, analysis: null, exercises: null, technicalDetails: null }
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

function saveAssessment(assessment) {
    const history = JSON.parse(localStorage.getItem('mobilityHistory') || '[]');
    history.push({
        ...assessment,
        date: new Date().toISOString(),
        finalAge: calculateFinalMobilityAge()
    });
    localStorage.setItem('mobilityHistory', JSON.stringify(history));
}

function getAssessmentHistory() {
    return JSON.parse(localStorage.getItem('mobilityHistory') || '[]');
}

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

        // Prepare the prompt
        const prompt = `As an expert physiotherapist with 20 years experience, analyze this ${currentPose} pose comparing to the ideal form speaking to the user in the first person. The person's actual age is ${assessmentData.userAge}. Analyze their mobility age using these specific criteria:

1. Alignment: Check joint alignment and posture against ideal form
- Perfect alignment = -5 years
- Minor misalignments = +0-5 years
- Moderate misalignments = +5-10 years
- Severe misalignments = +15-20 years

2. Range of Motion (ROM):
- Exceeds normal ROM = -5 years
- Normal ROM = +0 years
- Slightly limited = +5-10 years
- Moderately limited = +10-15 years
- Severely limited = +15-20 years

3. Compensations:
- No compensations = -5 years
- Minor compensations = +0-5 years
- Moderate compensations = +5-10 years
- Significant compensations = +10-15 years

4. Control and Stability:
- Excellent control = -5 years
- Good control = +0 years
- Fair control = +5-10 years
- Poor control = +10-15 years`;

        const response = await fetch('/.netlify/functions/gpt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                imageData: base64Data,
                prompt: prompt
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        console.log('API Response:', data);

        const resultText = data.choices[0].message.content;
        console.log('Result text:', resultText);

        try {
            // Try to parse the response directly first
            return JSON.parse(resultText.trim());
        } catch (initialError) {
            // If direct parsing fails, try to extract JSON from markdown
            try {
                const jsonMatch = resultText.match(/```json\n?(.*?)\n?```/s) || resultText.match(/{[\s\S]*}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[1] || jsonMatch[0]);
                }
                throw new Error('No valid JSON found in response');
            } catch (error) {
                console.error('Parsing error:', error);
                // Return a default response
                return {
                    analysis: [
                        "Unable to analyze image properly",
                        "Please ensure good lighting and clear view",
                        "Try taking the photo again"
                    ],
                    technicalDetails: {
                        rangeOfMotion: "Assessment unavailable",
                        compensation: "Unable to determine",
                        stability: "Unable to assess",
                        implications: "Please retake photo for accurate assessment"
                    },
                    mobilityAge: assessmentData.userAge,
                    exercises: [
                        {
                            name: "Basic Mobility Exercise",
                            description: "General mobility movement",
                            steps: ["Start position", "Execute movement", "Return to start"],
                            frequency: "Daily",
                            tips: ["Move slowly", "Maintain form"],
                            progression: "Increase repetitions",
                            regressions: "Reduce range of motion"
                        }
                    ]
                };
            }
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
                exercises: analysis.exercises,
                technicalDetails: analysis.technicalDetails
            };

            const analysisResult = document.getElementById('analysisResult');
            const technicalDetails = document.getElementById('technicalDetails');

            // Display analysis results
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

            // Display technical details
            technicalDetails.innerHTML = `
                <h4>Technical Assessment</h4>
                <div class="detail-item">
                    <div class="detail-label">Range of Motion:</div>
                    <div>${analysis.technicalDetails.rangeOfMotion}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Compensation Patterns:</div>
                    <div>${analysis.technicalDetails.compensation}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Stability Assessment:</div>
                    <div>${analysis.technicalDetails.stability}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Functional Implications:</div>
                    <div>${analysis.technicalDetails.implications}</div>
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
                        <div class="progression">
                            <h5>Progression:</h5>
                            <p>${exercise.progression}</p>
                        </div>
                        <div class="regression">
                            <h5>Modifications if needed:</h5>
                            <p>${exercise.regressions}</p>
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

function showFinalResults() {
    const finalAge = calculateFinalMobilityAge();
    const finalMobilityAge = document.getElementById('finalMobilityAge');
    const poseBreakdown = document.getElementById('poseBreakdown');
    const keyRecommendations = document.getElementById('keyRecommendations');

    saveAssessment(assessmentData);
    finalMobilityAge.textContent = finalAge;

    let breakdownHtml = assessmentData.poses.map((pose, index) => `
        <div class="pose-result">
            <h4>${pose.name}</h4>
            <p>Mobility Age: ${pose.mobilityAge}</p>
            <p>Key Observation: ${pose.analysis ? pose.analysis[0] : 'Not completed'}</p>
            <p>Technical Detail: ${pose.technicalDetails ? pose.technicalDetails.rangeOfMotion : 'Not available'}</p>
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
                    <p class="progression">Progress by: ${pose.exercises[0].progression}</p>
                </div>
            `;
        }
    });
    recommendationsHtml += '</div>';
    keyRecommendations.innerHTML = recommendationsHtml;

    // Create progress chart
    const history = getAssessmentHistory();
    const progressChart = document.getElementById('progressChart');

    if (history.length > 0) {
        const chartData = history.map(assessment => ({
            date: new Date(assessment.date).toLocaleDateString(),
            overall: assessment.finalAge,
            wallAngel: assessment.poses[0].mobilityAge,
            forwardFold: assessment.poses[1].mobilityAge,
            deepSquat: assessment.poses[2].mobilityAge,
            sideBend: assessment.poses[3].mobilityAge
        }));

        const chartHtml = `
            <div class="chart-container">
                <h3>Progress Over Time</h3>
                <div class="chart-legend">
                    <span class="legend-item"><span class="color-dot overall"></span>Overall</span>
                    <span class="legend-item"><span class="color-dot wall-angel"></span>Wall Angel</span>
                    <span class="legend-item"><span class="color-dot forward-fold"></span>Forward Fold</span>
                    <span class="legend-item"><span class="color-dot deep-squat"></span>Deep Squat</span>
                    <span class="legend-item"><span class="color-dot side-bend"></span>Side Bend</span>
                </div>
                <table class="progress-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Overall</th>
                            <th>Wall Angel</th>
                            <th>Forward Fold</th>
                            <th>Deep Squat</th>
                            <th>Side Bend</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${chartData.map(data => `
                            <tr>
                                <td>${data.date}</td>
                                <td>${data.overall}</td>
                                <td>${data.wallAngel}</td>
                                <td>${data.forwardFold}</td>
                                <td>${data.deepSquat}</td>
                                <td>${data.sideBend}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        progressChart.innerHTML = chartHtml;
    } else {
        progressChart.innerHTML = '<p>Complete more assessments to see your progress over time.</p>';
    }

    resultsSection.style.display = 'none';
    finalResultsSection.style.display = 'block';
}

viewFinalResults.addEventListener('click', showFinalResults);

[startOverButton, document.getElementById('finalStartOver')].forEach(button => {
    button.addEventListener('click', () => {
        [resultsSection, loadingScreen, uploadSection, poseInstructionSection, 
         ageSection, previewContainer, finalResultsSection, progressBar]
        .forEach(el => el.style.display = 'none');

        assessmentData = {
            userAge: null,
            currentPose: 0,
            date: new Date().toISOString(),
            poses: [
                { name: 'Wall Angel', mobilityAge: null, analysis: null, exercises: null, technicalDetails: null },
                { name: 'Forward Fold', mobilityAge: null, analysis: null, exercises: null, technicalDetails: null },
                { name: 'Deep Squat', mobilityAge: null, analysis: null, exercises: null, technicalDetails: null },
                { name: 'Side Bend', mobilityAge: null, analysis: null, exercises: null, technicalDetails: null }
            ]
        };

        startButton.style.display = 'block';
        photoPreview.src = '';
        currentPhotoData = null;

        // Clear progress chart
        const progressChart = document.getElementById('progressChart');
        if (progressChart) {
            progressChart.innerHTML = '';
        }
    });
});
