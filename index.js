const express = require('express');
const multer = require('multer');
const path = require('path');
const sanityClient = require('@sanity/client');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Configure the Sanity client (groq API)
// Replace 'yourProjectId' and 'yourDataset' with your actual Sanity project details.
const client = sanityClient({
  projectId: 'nsexutqm',         // Replace with your project ID
  dataset: 'production',             // Replace with your dataset name
  token: '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', // Provided API key
  useCdn: false,                      // Set to false to always fetch fresh data
  apiVersion: '2023-01-01'            // Use an appropriate API version
});

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public folder
app.use(express.static('public'));

// Serve the HTML form for CupidIQ
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Dummy analysis function for photos
async function analyzePhoto(file) {
  // Integrate your image analysis logic or model here.
  return {
    photoScore: 7,
    suggestions: "Consider a naturally lit photo with a friendly expression."
  };
}

// Dummy analysis function for bios
async function analyzeBio(bioText) {
  // Integrate your text analysis logic or model here.
  return {
    bioScore: 8,
    suggestions: "Try adding specific hobbies or interests to connect culturally."
  };
}

// Endpoint to process profile analysis
app.post('/analyze', upload.single('photo'), async (req, res) => {
  try {
    // Extract user inputs from the form
    const { location, ageRange, weight, height, ethnicity, gender, bio } = req.body;

    // Run dummy analysis on the uploaded photo (if provided) and bio
    const photoAnalysis = req.file ? await analyzePhoto(req.file) : null;
    const bioAnalysis = await analyzeBio(bio);

    // GROQ query to fetch trend data based on user's input
    const query = `
      *[_type == "trendData" &&
        location match $location &&
        ageRange == $ageRange &&
        gender == $gender &&
        ethnicity == $ethnicity
      ]{
        title,
        description,
        recommendations
      }
    `;
    const params = { location, ageRange, gender, ethnicity };

    // Fetch trend data from the groq API
    const trendData = await client.fetch(query, params);

    // Combine the analysis and trend data into a feedback object
    const feedback = {
      photoAnalysis,
      bioAnalysis,
      trendData
    };

    res.json(feedback);
  } catch (error) {
    console.error("Error during analysis:", error);
    res.status(500).json({ error: "An error occurred during analysis." });
  }
});

// Start the server for CupidIQ
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`CupidIQ server running on port ${PORT}`);
});
