/* =========================================================
   AGRISHIELD AI - MAIN SCRIPT
   Corrected / cleaned version
   ========================================================= */


/* =========================================================
   BACKEND DISEASE LABELS
   ========================================================= */

const LABEL_TO_INFO = {
    tomato_early_blight: {
        cropKey: "tomato",
        disease: "Possible Early Blight",
        diseaseHi: "संभावित अर्ली ब्लाइट (अगेती झुलसा)",
        diseaseMr: "संभाव्य अर्ली ब्लाइट (लवकर येणारा करपा)"
    },

    potato_late_blight: {
        cropKey: "potato",
        disease: "Possible Late Blight",
        diseaseHi: "संभावित लेट ब्लाइट (पछेती झुलसा)",
        diseaseMr: "संभाव्य लेट ब्लाइट (उशिरा येणारा करपा)"
    },

    wheat_leaf_rust: {
        cropKey: "wheat",
        disease: "Possible Leaf Rust",
        diseaseHi: "संभावित पत्ती रतुआ (लीफ रस्ट)",
        diseaseMr: "संभाव्य पानांवरील तांबेरा (लीफ रस्ट)"
    },

    rice_blast: {
        cropKey: "rice",
        disease: "Possible Rice Blast",
        diseaseHi: "संभावित राइस ब्लास्ट (झोंका रोग)",
        diseaseMr: "संभाव्य भातावरील करपा (राइस ब्लास्ट)"
    }
};


/* =========================================================
   API CONFIG
   ========================================================= */

const API_URL = (window.AGRISHIELD_API_URL || "").replace(/\/$/, "");


/* =========================================================
   SAMPLE CROP DATA
   ========================================================= */

const cropData = {

    tomato: {
        cropName: "Tomato",
        disease: "Possible Early Blight",
        risk: "Medium",
        confidence: "82%",

        description:
            "The selected crop matches a sample pattern associated with early blight symptoms.",

        symptoms: [
            "Brown spots on leaves",
            "Yellowing of leaves",
            "Weak plant growth"
        ],

        suggestions: [
            "Remove severely affected leaves if appropriate",
            "Avoid unnecessary overhead watering",
            "Maintain proper field hygiene",
            "Monitor nearby plants regularly",
            "Consult a local agriculture expert"
        ]
    },

    potato: {
        cropName: "Potato",
        disease: "Possible Late Blight",
        risk: "High",
        confidence: "79%",

        description:
            "The selected crop matches a sample pattern associated with late blight symptoms.",

        symptoms: [
            "Dark patches on leaves",
            "Leaf damage in humid conditions",
            "Brown marks on plant parts"
        ],

        suggestions: [
            "Inspect nearby plants carefully",
            "Avoid excessive moisture",
            "Maintain field hygiene",
            "Monitor the crop regularly",
            "Seek expert advice before treatment"
        ]
    },

    wheat: {
        cropName: "Wheat",
        disease: "Possible Leaf Rust",
        risk: "Medium",
        confidence: "76%",

        description:
            "The selected crop matches a sample pattern associated with leaf rust symptoms.",

        symptoms: [
            "Orange or brown spots on leaves",
            "Reduced leaf health",
            "Visible discoloration"
        ],

        suggestions: [
            "Inspect the complete field",
            "Monitor crop growth regularly",
            "Remove affected plant material if appropriate",
            "Maintain proper field management",
            "Consult an agriculture expert"
        ]
    },

    rice: {
        cropName: "Rice",
        disease: "Possible Rice Blast",
        risk: "High",
        confidence: "81%",

        description:
            "The selected crop matches a sample pattern associated with rice blast symptoms.",

        symptoms: [
            "Spindle-shaped spots on leaves",
            "Leaf discoloration",
            "Reduced plant health"
        ],

        suggestions: [
            "Monitor affected areas regularly",
            "Avoid excessive nitrogen application",
            "Maintain proper field management",
            "Inspect nearby plants",
            "Consult a local agriculture expert"
        ]
    }
};


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const cropSelect = document.getElementById("cropSelect");
const cropImage = document.getElementById("cropImage");
const imagePreview = document.getElementById("imagePreview");
const analyzeBtn = document.getElementById("analyzeBtn");
const analysisMessage = document.getElementById("analysisMessage");

const resultBox = document.getElementById("resultBox");
const resultCrop = document.getElementById("resultCrop");
const riskLevel = document.getElementById("riskLevel");
const confidenceScore = document.getElementById("confidenceScore");
const diseaseName = document.getElementById("diseaseName");
const resultDescription = document.getElementById("resultDescription");
const symptomsList = document.getElementById("symptomsList");
const suggestionsList = document.getElementById("suggestionsList");
const analysisTime = document.getElementById("analysisTime");
const reportId = document.getElementById("reportId");


/* =========================================================
   SAFE TRANSLATION HELPERS
   ========================================================= */

function safeTr(text) {
    try {
        return typeof tr === "function" ? tr(text) : text;
    } catch (e) {
        return text;
    }
}

function safePick(en, hi, mr) {
    try {
        return typeof pick === "function"
            ? pick(en, hi, mr)
            : en;
    } catch (e) {
        return en;
    }
}

function safeCurrentLang() {
    try {
        return typeof currentLang === "function"
            ? currentLang()
            : "en";
    } catch (e) {
        return "en";
    }
}


/* =========================================================
   BACKEND ANALYSIS
   ========================================================= */

async function analyzeWithApi(selectedCrop, selectedImage) {

    if (!API_URL) {
        return null;
    }

    const form = new FormData();

    form.append("image", selectedImage);
    form.append("crop", selectedCrop);

    try {

        const response = await fetch(
            API_URL + "/predict",
            {
                method: "POST",
                body: form
            }
        );

        if (!response.ok) {

            let body = {};

            try {
                body = await response.json();
            } catch (e) {
                body = {};
            }

            if (analysisMessage) {
                analysisMessage.textContent =
                    body.detail ||
                    safeTr(
                        "The AI server could not read that image. Please try another photo."
                    );
            }

            return null;
        }

        const result = await response.json();

        return result;

    } catch (networkError) {

        console.error("AI API error:", networkError);

        if (analysisMessage) {
            analysisMessage.textContent =
                safeTr(
                    "Could not reach the AI server. Please check your internet and try again."
                );
        }

        return null;
    }
}


/* =========================================================
   IMAGE PREVIEW
   ========================================================= */

if (cropImage) {

    cropImage.addEventListener("change", function () {

        const file = cropImage.files && cropImage.files[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {

            if (analysisMessage) {
                analysisMessage.textContent =
                    safeTr("Please select a valid image file.");
            }

            cropImage.value = "";

            if (imagePreview) {
                imagePreview.style.display = "none";
            }

            return;
        }

        const imageURL = URL.createObjectURL(file);

        if (imagePreview) {
            imagePreview.src = imageURL;
            imagePreview.style.display = "block";
        }

        if (analysisMessage) {
            analysisMessage.textContent =
                safeTr(
                    "Image uploaded successfully. Now click Analyze Crop."
                );
        }

        if (resultBox) {
            resultBox.style.display = "none";
        }
    });
}


/* =========================================================
   ANALYZE CROP
   ========================================================= */

let lastAnalyzedCrop = "";

if (analyzeBtn) {

    analyzeBtn.addEventListener("click", async function () {

        const selectedCrop = cropSelect ? cropSelect.value : "";
        const selectedImage =
            cropImage && cropImage.files
                ? cropImage.files[0]
                : null;

        /* Validate crop */

        if (!selectedCrop) {

            if (analysisMessage) {
                analysisMessage.textContent =
                    safeTr("Please select a crop first.");
            }

            if (resultBox) {
                resultBox.style.display = "none";
            }

            return;
        }


        /* Validate image */

        if (!selectedImage) {

            if (analysisMessage) {
                analysisMessage.textContent =
                    safeTr("Please upload a crop image first.");
            }

            if (resultBox) {
                resultBox.style.display = "none";
            }

            return;
        }


        let data = cropData[selectedCrop];

        if (!data) {
            if (analysisMessage) {
                analysisMessage.textContent =
                    safeTr("This crop is not supported yet.");
            }
            return;
        }


        let usedApi = false;
        let lowConfidence = false;


        /* REAL API */

        if (API_URL) {

            analyzeBtn.disabled = true;

            if (analysisMessage) {
                analysisMessage.textContent =
                    safeTr("Analyzing your photo...");
            }

            const apiResult =
                await analyzeWithApi(
                    selectedCrop,
                    selectedImage
                );

            analyzeBtn.disabled = false;


            if (!apiResult) {

                if (resultBox) {
                    resultBox.style.display = "none";
                }

                return;
            }


            const info =
                LABEL_TO_INFO[apiResult.label];


            lowConfidence =
                Boolean(apiResult.low_confidence);


            const confidenceNumber =
                Number(apiResult.confidence);


            const confidenceText =
                Number.isFinite(confidenceNumber)
                    ? Math.round(confidenceNumber * 100) + "%"
                    : data.confidence;


            if (info) {

                const baseCrop =
                    cropData[info.cropKey] ||
                    cropData[selectedCrop];

                data = Object.assign(
                    {},
                    baseCrop,
                    {
                        disease: info.disease,
                        confidence: confidenceText
                    }
                );

            } else {

                data = Object.assign(
                    {},
                    cropData[selectedCrop],
                    {
                        disease:
                            "Possible plant health issue",

                        description:
                            "We could not match this result to a disease for which written advice is available. Please show this photo to an agriculture expert.",

                        symptoms: [],

                        suggestions: [
                            "Mark or monitor the affected plants",
                            "Avoid unnecessary overhead watering",
                            "Consult a local agriculture expert"
                        ],

                        confidence: confidenceText
                    }
                );
            }

            usedApi = true;
        }


        /* SAVE LAST CROP */

        lastAnalyzedCrop = selectedCrop;


        /* BASIC RESULT INFORMATION */

        if (resultCrop) {
            resultCrop.textContent =
                data.cropName;
        }

        if (riskLevel) {
            riskLevel.textContent =
                safeTr(data.risk);
        }

        if (confidenceScore) {
            confidenceScore.textContent =
                data.confidence;
        }

        if (diseaseName) {
            diseaseName.textContent =
                data.disease;
        }

        if (resultDescription) {

            resultDescription.textContent =
                lowConfidence
                    ? safeTr(
                        "The photo was not clear enough for a confident result. Please retake it in good light and try again. Showing the closest possible match below."
                    )
                    : data.description;
        }


        /* CLEAR OLD LISTS */

        if (symptomsList) {
            symptomsList.innerHTML = "";
        }

        if (suggestionsList) {
            suggestionsList.innerHTML = "";
        }


        /* ADD SYMPTOMS */

        if (symptomsList && Array.isArray(data.symptoms)) {

            data.symptoms.forEach(function (symptom) {

                const listItem =
                    document.createElement("li");

                listItem.textContent =
                    symptom;

                symptomsList.appendChild(listItem);
            });
        }


        /* ADD SUGGESTIONS */

        if (
            suggestionsList &&
            Array.isArray(data.suggestions)
        ) {

            data.suggestions.forEach(
                function (suggestion) {

                    const listItem =
                        document.createElement("li");

                    listItem.textContent =
                        suggestion;

                    suggestionsList.appendChild(listItem);
                }
            );
        }


        /* DATE + TIME */

        const currentTime =
            new Date();

        if (analysisTime) {

            const lang =
                safeCurrentLang();

            const locale =
                {
                    hi: "hi-IN",
                    mr: "mr-IN"
                }[lang] || "en-IN";

            analysisTime.textContent =
                currentTime.toLocaleString(locale);
        }


        /* REPORT ID */

        const generatedReportId =
            "AGRI-" +
            Date.now()
                .toString()
                .slice(-6);

        if (reportId) {
            reportId.textContent =
                generatedReportId;
        }


        /* SHOW RESULT */

        if (resultBox) {
            resultBox.style.display = "block";
        }

        if (analysisMessage) {
            analysisMessage.textContent =
                usedApi
                    ? safeTr("Analysis completed.")
                    : safeTr(
                        "Demo analysis completed successfully!"
                    );
        }


        /* PERSONALIZED PLAN */

        if (typeof renderPlan === "function") {
            renderPlan();
        }


        /* SCROLL */

        if (resultBox) {

            resultBox.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }

    });
}


/* =========================================================
   AGRIBUDDY CHATBOT
   ========================================================= */

const chatbotContainer =
    document.getElementById("chatbotContainer");

const openChatbot =
    document.getElementById("openChatbot");

const closeChatbot =
    document.getElementById("closeChatbot");

const chatInput =
    document.getElementById("chatInput");

const sendChatBtn =
    document.getElementById("sendChatBtn");

const chatMessages =
    document.getElementById("chatMessages");


if (openChatbot) {

    openChatbot.addEventListener(
        "click",
        function () {

            if (chatbotContainer) {
                chatbotContainer.style.display =
                    "block";
            }

            if (chatInput) {
                chatInput.focus();
            }
        }
    );
}


if (closeChatbot) {

    closeChatbot.addEventListener(
        "click",
        function () {

            if (chatbotContainer) {
                chatbotContainer.style.display =
                    "none";
            }
        }
    );
}


function addChatMessage(message, sender) {

    if (!chatMessages) {
        return;
    }

    const messageElement =
        document.createElement("div");

    messageElement.classList.add(
        sender === "bot"
            ? "bot-message"
            : "user-message"
    );

    messageElement.textContent =
        message;

    chatMessages.appendChild(
        messageElement
    );

    chatMessages.scrollTop =
        chatMessages.scrollHeight;
}


function getBotResponse(question) {

    const text =
        String(question || "").toLowerCase();

    const lang =
        safeCurrentLang();


    if (
        lang === "hi" &&
        typeof getBotResponseHi === "function"
    ) {
        return getBotResponseHi(text);
    }


    if (
        lang === "mr" &&
        typeof getBotResponseMr === "function"
    ) {
        return getBotResponseMr(text);
    }


    if (
        text.includes("hello") ||
        /\bhi\b/.test(text) ||
        text.includes("namaste") ||
        text.includes("नमस्ते")
    ) {

        return "Namaste bhai! 🌱 Batao, tumhari crop ke baare mein kya help chahiye?";
    }


    if (
        text.includes("tomato") ||
        text.includes("टमाटर")
    ) {

        return "Tomato ke leaves par spots hain? 🌿 Image upload karke analysis dekho. Real treatment ke liye agriculture expert se confirm karna.";
    }


    if (
        text.includes("disease") ||
        text.includes("रोग") ||
        text.includes("बीमारी")
    ) {

        return "Crop disease ke liye affected leaves ki clear photo lo, crop select karo aur Analyze Crop par click karo.";
    }


    if (
        text.includes("weather") ||
        text.includes("मौसम")
    ) {

        return "High humidity aur continuous rain se kuch crop diseases ka risk badh sakta hai. Weather Alert section check karo.";
    }


    if (
        text.includes("water") ||
        text.includes("पानी")
    ) {

        return "Bhai, crop ko zaroorat ke hisaab se paani do. Overwatering se roots aur leaves ko problem ho sakti hai.";
    }


    if (
        text.includes("help") ||
        text.includes("madad") ||
        text.includes("मदद")
    ) {

        return "Main crop selection, sample analysis, weather risk aur basic crop-care information mein help kar sakta hoon. 🌾";
    }


    return "Bhai, main abhi demo assistant hoon. Tum crop ka naam, disease, weather ya farming care ke baare mein pooch sakte ho. 🌱";
}


let speakNextReply = false;


function sendChatMessage() {

    if (!chatInput) {
        return;
    }

    const question =
        chatInput.value.trim();

    if (!question) {
        return;
    }

    addChatMessage(
        question,
        "user"
    );

    const response =
        getBotResponse(question);


    setTimeout(
        function () {

            addChatMessage(
                response,
                "bot"
            );

            if (
                speakNextReply &&
                typeof speakText === "function"
            ) {

                speakText(
                    response,
                    null
                );

                speakNextReply =
                    false;
            }

        },
        300
    );


    chatInput.value = "";
}


if (sendChatBtn) {

    sendChatBtn.addEventListener(
        "click",
        sendChatMessage
    );
}


if (chatInput) {

    chatInput.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                event.preventDefault();

                sendChatMessage();
            }
        }
    );
}

/* =========================================================
   REAL SUPABASE REPORT HISTORY
   ========================================================= */

const historyList =
    document.getElementById("historyList");

const clearHistoryBtn =
    document.getElementById("clearHistoryBtn");

let cachedReports = [];


/* ---------------------------------------------------------
   GET CURRENT USER
--------------------------------------------------------- */

async function getCurrentUser() {

    if (!supabaseClient) {
        return null;
    }

    try {

        const {
            data,
            error
        } = await supabaseClient.auth.getUser();

        if (error) {
            console.error("User error:", error);
            return null;
        }

        return data?.user || null;

    } catch (error) {

        console.error(
            "Could not get current user:",
            error
        );

        return null;
    }
}


/* ---------------------------------------------------------
   LOAD REPORTS FROM SUPABASE
--------------------------------------------------------- */

async function getSavedReports() {

    if (!supabaseClient) {
        return [];
    }

    const user =
        await getCurrentUser();

    if (!user) {
        return [];
    }

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("reports")
                .select("*")
                .eq("user_id", user.id)
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );

        if (error) {

            console.error(
                "Could not load reports:",
                error
            );

            return [];
        }

        cachedReports =
            data || [];

        return cachedReports;

    } catch (error) {

        console.error(
            "Report loading error:",
            error
        );

        return [];
    }
}


/* ---------------------------------------------------------
   RENDER HISTORY
--------------------------------------------------------- */

async function renderHistory() {

    if (!historyList) {
        return;
    }

    historyList.innerHTML =
        '<p class="empty-history">Loading your reports...</p>';

    const reports =
        await getSavedReports();

    historyList.innerHTML = "";


    if (!reports.length) {

        const empty =
            document.createElement("p");

        empty.className =
            "empty-history";

        empty.textContent =
            safeTr(
                "No analysis reports saved yet."
            );

        historyList.appendChild(
            empty
        );

        return;
    }


    reports
        .slice(0, 20)
        .forEach(function (report) {

            const item =
                document.createElement("div");

            item.className =
                "history-item";


            const left =
                document.createElement("div");


            const title =
                document.createElement("strong");

            title.textContent =
                safeTr(report.crop || "Crop") +
                " — " +
                safeTr(
                    report.disease ||
                    "Analysis"
                );


            const meta =
                document.createElement("span");

            const date =
                report.created_at
                    ? new Date(
                        report.created_at
                    ).toLocaleString(
                        "en-IN"
                    )
                    : report.analysis_time ||
                      "";


            meta.textContent =
                date +
                " · " +
                safeTr("Report ID") +
                ": " +
                report.report_id;


            left.append(
                title,
                meta
            );


            const actions =
                document.createElement("div");

            actions.className =
                "history-actions";


            const risk =
                document.createElement("strong");

            risk.className =
                "history-risk";

            risk.textContent =
                safeTr(
                    report.risk_level ||
                    "Unknown"
                );


            const viewButton =
                document.createElement("button");

            viewButton.type =
                "button";

            viewButton.className =
                "history-view-btn";

            viewButton.textContent =
                "View";


            viewButton.addEventListener(
                "click",
                function () {

                    showReportDetails(
                        report
                    );
                }
            );


            const downloadButton =
                document.createElement("button");

            downloadButton.type =
                "button";

            downloadButton.className =
                "history-download-btn";

            downloadButton.textContent =
                "Download PDF";


            downloadButton.addEventListener(
                "click",
                function () {

                    downloadReportPDF(
                        report
                    );
                }
            );


            actions.append(
                risk,
                viewButton,
                downloadButton
            );


            item.append(
                left,
                actions
            );


            historyList.appendChild(
                item
            );
        });
}


/* ---------------------------------------------------------
   SAVE REPORT TO SUPABASE
--------------------------------------------------------- */

async function saveReport(report) {

    if (!supabaseClient) {
        return null;
    }

    const user =
        await getCurrentUser();

    if (!user) {

        console.warn(
            "Report not saved because user is not logged in."
        );

        return null;
    }


    try {

        const payload = {

            user_id:
                user.id,

            report_id:
                report.id,

            crop:
                report.crop || "",

            disease:
                report.disease || "",

            risk_level:
                report.risk || "",

            confidence:
                report.confidence || "",

            description:
                report.description || "",

            symptoms:
                Array.isArray(
                    report.symptoms
                )
                    ? report.symptoms
                    : [],

            suggestions:
                Array.isArray(
                    report.suggestions
                )
                    ? report.suggestions
                    : [],

            farmer_name:
                report.farmerName || "",

            farm_land:
                report.farmLand
                    ? Number(report.farmLand)
                    : null,

            crop_stage:
                report.cropStage || "",

            water_source:
                report.waterSource || "",

            analysis_time:
                report.analysisTime
                    ? new Date(
                        report.analysisTime
                    ).toISOString()
                    : new Date().toISOString()
        };


        const {
            data,
            error
        } =
            await supabaseClient
                .from("reports")
                .upsert(
                    payload,
                    {
                        onConflict:
                            "user_id,report_id"
                    }
                )
                .select()
                .single();


        if (error) {

            console.error(
                "Supabase report save error:",
                error
            );

            return null;
        }


        console.log(
            "✅ Report saved:",
            data
        );


        await renderHistory();

        return data;

    } catch (error) {

        console.error(
            "Report save failed:",
            error
        );

        return null;
    }
}


/* ---------------------------------------------------------
   DELETE ALL USER REPORTS
--------------------------------------------------------- */

if (clearHistoryBtn) {

    clearHistoryBtn.addEventListener(
        "click",
        async function () {

            const user =
                await getCurrentUser();

            if (!user) {

                alert(
                    "Please login first."
                );

                return;
            }


            const confirmed =
                window.confirm(
                    "Delete all your saved reports?"
                );


            if (!confirmed) {
                return;
            }


            const {
                error
            } =
                await supabaseClient
                    .from("reports")
                    .delete()
                    .eq(
                        "user_id",
                        user.id
                    );


            if (error) {

                console.error(
                    "Delete reports error:",
                    error
                );

                alert(
                    "Could not delete reports."
                );

                return;
            }


            await renderHistory();
        }
    );
}

function renderHistory() {

    if (!historyList) {
        return;
    }

    const reports =
        getSavedReports();

    historyList.innerHTML = "";


    if (!reports.length) {

        const empty =
            document.createElement("p");

        empty.className =
            "empty-history";

        empty.textContent =
            safeTr(
                "No analysis reports saved yet."
            );

        historyList.appendChild(
            empty
        );

        return;
    }


    reports
        .slice(0, 8)
        .forEach(function (report) {

            const item =
                document.createElement("div");

            item.className =
                "history-item";


            const left =
                document.createElement("div");


            const title =
                document.createElement("strong");

            title.textContent =
                safeTr(report.crop) +
                " — " +
                safeTr(report.disease);


            const meta =
                document.createElement("span");

            meta.textContent =
                report.time +
                " · " +
                safeTr("Report ID") +
                ": " +
                report.id;


            left.append(
                title,
                meta
            );


            const risk =
                document.createElement("strong");

            risk.textContent =
                safeTr(report.risk) +
                " " +
                safeTr("Risk");


            item.append(
                left,
                risk
            );


            historyList.appendChild(
                item
            );
        });
}


function saveReport(report) {

    try {

        const reports =
            getSavedReports();

        reports.unshift(report);

        localStorage.setItem(
            "agrishieldReports",
            JSON.stringify(
                reports.slice(0, 20)
            )
        );

        renderHistory();

    } catch (error) {

        console.error(
            "Could not save report:",
            error
        );
    }
}


if (clearHistoryBtn) {

    clearHistoryBtn.addEventListener(
        "click",
        function () {

            localStorage.removeItem(
                "agrishieldReports"
            );

            renderHistory();
        }
    );
}


/* =========================================================
   LOGIN MODAL
   ========================================================= */

const openLoginBtn = document.getElementById("openLoginBtn"); const closeLoginBtn = document.getElementById("closeLoginBtn"); const loginModal = document.getElementById("loginModal"); function openLoginModal() { if (!loginModal) { return; } loginModal.classList.add( "active" ); loginModal.setAttribute( "aria-hidden", "false" ); } function closeLoginModal() { if (!loginModal) { return; } loginModal.classList.remove( "active" ); loginModal.setAttribute( "aria-hidden", "true" ); } if (openLoginBtn) { openLoginBtn.addEventListener( "click", openLoginModal ); } if (closeLoginBtn) { closeLoginBtn.addEventListener( "click", closeLoginModal ); } if (loginModal) { loginModal.addEventListener( "click", function (event) { if ( event.target === loginModal ) { closeLoginModal(); } } ); }


/* =========================================================
   SAVE ANALYSIS REPORT
   ========================================================= */
   /* =========================================================
   SAVE COMPLETED ANALYSIS TO SUPABASE
   ========================================================= */

if (analyzeBtn) {

    analyzeBtn.addEventListener(
        "click",
        async function () {

            setTimeout(
                async function () {

                    if (
                        !resultBox ||
                        resultBox.style.display !== "block"
                    ) {
                        return;
                    }


                    const user =
                        await getCurrentUser();


                    if (!user) {

                        console.warn(
                            "User is not logged in. Report will not be saved."
                        );

                        return;
                    }


                    const profile =
                        readProfile();


                    const report = {

                        id:
                            reportId
                                ? reportId.textContent
                                : "AGRI-" +
                                  Date.now()
                                      .toString()
                                      .slice(-6),

                        crop:
                            resultCrop
                                ? resultCrop.textContent
                                : "",

                        disease:
                            diseaseName
                                ? diseaseName.textContent
                                : "",

                        risk:
                            riskLevel
                                ? riskLevel.textContent
                                : "",

                        confidence:
                            confidenceScore
                                ? confidenceScore.textContent
                                : "",

                        description:
                            resultDescription
                                ? resultDescription.textContent
                                : "",

                        symptoms:
                            symptomsList
                                ? Array.from(
                                    symptomsList.querySelectorAll("li")
                                ).map(
                                    function (li) {
                                        return li.textContent;
                                    }
                                )
                                : [],

                        suggestions:
                            suggestionsList
                                ? Array.from(
                                    suggestionsList.querySelectorAll("li")
                                ).map(
                                    function (li) {
                                        return li.textContent;
                                    }
                                )
                                : [],

                        farmerName:
                            profile.name || "",

                        farmLand:
                            profile.land || "",

                        cropStage:
                            profile.stage || "",

                        waterSource:
                            profile.water || "",

                        analysisTime:
                            analysisTime
                                ? analysisTime.textContent
                                : new Date().toISOString()
                    };


                    await saveReport(
                        report
                    );


                    console.log(
                        "🌱 AgriShield report stored in Supabase."
                    );

                },
                300
            );
        }
    );
}




/* =========================================================
   REAL SUPABASE AUTHENTICATION
   ========================================================= */

const authEmail =
    document.getElementById("authEmail");

const authPassword =
    document.getElementById("authPassword");

const emailLoginBtn =
    document.getElementById("emailLoginBtn");

const emailSignupBtn =
    document.getElementById("emailSignupBtn");

const loginStatus =
    document.getElementById("loginStatus");


/*
   IMPORTANT:
   Supabase client must be created in config.js:

   window.supabaseClient = window.supabase.createClient(
       "YOUR_SUPABASE_URL",
       "YOUR_SUPABASE_ANON_KEY"
   );
*/

const supabaseClient =
    window.supabaseClient || null;


if (!supabaseClient) {

    console.error(
        "Supabase client not found. Check config.js."
    );

    if (loginStatus) {

        loginStatus.textContent =
            "Supabase connection failed. Check config.js.";
    }
}


/* =========================================================
   SUPABASE SIGN UP
   ========================================================= */

if (
    emailSignupBtn &&
    supabaseClient
) {

    emailSignupBtn.addEventListener(
        "click",
        async function () {

            const email =
                authEmail
                    ? authEmail.value.trim()
                    : "";

            const password =
                authPassword
                    ? authPassword.value
                    : "";


            if (!email || !password) {

                if (loginStatus) {
                    loginStatus.textContent =
                        "Please enter email and password.";
                }

                return;
            }


            if (password.length < 6) {

                if (loginStatus) {
                    loginStatus.textContent =
                        "Password must be at least 6 characters.";
                }

                return;
            }


            if (loginStatus) {
                loginStatus.textContent =
                    "Creating your account...";
            }


            try {

                const result =
                    await supabaseClient.auth.signUp({
                        email: email,
                        password: password
                    });


                const data =
                    result.data;

                const error =
                    result.error;


                if (error) {

                    console.error(
                        "Signup error:",
                        error
                    );

                    if (loginStatus) {
                        loginStatus.textContent =
                            error.message;
                    }

                    return;
                }


                console.log(
                    "Signup successful:",
                    data
                );


                if (data && data.session) {

                    if (loginStatus) {
                        loginStatus.textContent =
                            "Account created successfully!";
                    }

                } else {

                    if (loginStatus) {
                        loginStatus.textContent =
                            "Account created! Please check your email to verify your account.";
                    }
                }

            } catch (error) {

                console.error(
                    "Signup exception:",
                    error
                );

                if (loginStatus) {
                    loginStatus.textContent =
                        "Something went wrong while creating your account.";
                }
            }
        }
    );
}


/* =========================================================
   SUPABASE LOGIN
   ========================================================= */

if (
    emailLoginBtn &&
    supabaseClient
) {

    emailLoginBtn.addEventListener(
        "click",
        async function () {

            const email =
                authEmail
                    ? authEmail.value.trim()
                    : "";

            const password =
                authPassword
                    ? authPassword.value
                    : "";


            if (!email || !password) {

                if (loginStatus) {
                    loginStatus.textContent =
                        "Please enter email and password.";
                }

                return;
            }


            if (loginStatus) {
                loginStatus.textContent =
                    "Logging you in...";
            }


            try {

                const result =
                    await supabaseClient.auth.signInWithPassword({
                        email: email,
                        password: password
                    });


                const data =
                    result.data;

                const error =
                    result.error;


                if (error) {

                    console.error(
                        "Login error:",
                        error
                    );

                    if (loginStatus) {
                        loginStatus.textContent =
                            error.message;
                    }

                    return;
                }


                console.log(
                    "Login successful:",
                    data
                );


                if (loginStatus) {

                    loginStatus.textContent =
                        "Login successful! Welcome to AgriShield AI 🌱";
                }


                closeLoginModal();


                if (openLoginBtn) {

                    openLoginBtn.textContent =
                        "Account";
                }

            } catch (error) {

                console.error(
                    "Login exception:",
                    error
                );

                if (loginStatus) {
                    loginStatus.textContent =
                        "Something went wrong while logging in.";
                }
            }
        }
    );
}


/* =========================================================
   CURRENT SUPABASE USER
   ========================================================= */

async function checkAuthUser() {

    if (!supabaseClient) {
        return;
    }


    try {

        const result =
            await supabaseClient.auth.getUser();


        const user =
            result.data
                ? result.data.user
                : null;


        if (user) {

            console.log(
                "Logged in user:",
                user.email
            );


            if (openLoginBtn) {

                openLoginBtn.textContent =
                    "Account";
            }
        }

    } catch (error) {

        console.log(
            "No logged-in user."
        );
    }
}


/* =========================================================
   SUPABASE SESSION LISTENER
   ========================================================= */

if (supabaseClient) {

    supabaseClient.auth.onAuthStateChange(
        function (event, session) {

            console.log(
                "Auth event:",
                event
            );


            if (session) {

                console.log(
                    "User logged in:",
                    session.user.email
                );

                if (openLoginBtn) {
                    openLoginBtn.textContent =
                        "Account";
                }

            } else {

                console.log(
                    "User logged out"
                );

                if (openLoginBtn) {
                    openLoginBtn.textContent =
                        "Login";
                }
            }
        }
    );
}


/* =========================================================
   PERSONALIZED GUIDANCE
   ========================================================= */

const PROFILE_KEY =
    "agrishieldProfile";


const profileIds = {
    name: "farmerName",
    land: "farmLand",
    stage: "cropStage",
    water: "waterSource"
};


const stageTips = {

    sowing:
        "Seedlings are delicate and infection spreads fast, so check them every 2 to 3 days.",

    growing:
        "Leaves are your early warning. Check the underside of leaves too, not just the top.",

    flowering:
        "Flowering is a sensitive stage. Acting early protects your flowers and fruit.",

    harvest:
        "You are close to harvest. Check the waiting period on any spray label before picking."
};


const waterTips = {

    rainfed:
        "Rain-fed field: after rain, wet leaves raise disease risk, so inspect the crop the next morning.",

    canal:
        "Canal water: avoid flooding the field and irrigate in the morning so leaves dry by evening.",

    borewell:
        "Borewell: water in the morning and avoid over-irrigation. Wet soil helps disease spread.",

    drip:
        "Drip irrigation: you already keep leaves dry, so keep it that way and check for leaks near affected plants."
};


function readProfile() {

    const profile = {};

    Object.keys(profileIds)
        .forEach(function (key) {

            const el =
                document.getElementById(
                    profileIds[key]
                );

            profile[key] =
                el
                    ? el.value.trim()
                    : "";
        });

    return profile;
}


function saveProfile() {

    try {

        localStorage.setItem(
            PROFILE_KEY,
            JSON.stringify(
                readProfile()
            )
        );

    } catch (e) {

        console.error(
            "Could not save profile:",
            e
        );
    }

    updateGreeting();
}


function loadProfile() {

    try {

        const saved =
            JSON.parse(
                localStorage.getItem(
                    PROFILE_KEY
                ) || "{}"
            );


        Object.keys(profileIds)
            .forEach(function (key) {

                const el =
                    document.getElementById(
                        profileIds[key]
                    );


                if (
                    el &&
                    saved[key]
                ) {
                    el.value =
                        saved[key];
                }
            });

    } catch (e) {

        console.error(
            "Could not load profile:",
            e
        );
    }

    updateGreeting();
}


function localizedCrop(key) {

    const en =
        cropData[key];

    if (!en) {
        return null;
    }


    try {

        if (
            typeof CROP_TR !== "undefined" &&
            typeof currentLang === "function"
        ) {

            const t =
                CROP_TR[
                    currentLang()
                ];

            return t
                ? Object.assign(
                    {},
                    en,
                    t[key]
                )
                : en;
        }

    } catch (e) {
        console.warn(
            "Localization fallback:",
            e
        );
    }


    return en;
}


function updateGreeting() {

    const greeting =
        document.getElementById(
            "personalGreeting"
        );


    if (!greeting) {
        return;
    }


    const name =
        readProfile().name;


    if (name) {

        greeting.textContent =
            safePick(
                "Namaste, " +
                    name +
                    " ji. Your advice is set for your farm.",

                "नमस्ते, " +
                    name +
                    " जी। आपकी सलाह आपके खेत के हिसाब से तैयार है।",

                "नमस्कार, " +
                    name +
                    " जी. तुमचा सल्ला तुमच्या शेतानुसार तयार आहे."
            );

    } else {

        greeting.textContent =
            safeTr(
                "Your advice will be shaped around these answers."
            );
    }
}


function renderPlan() {

    const box =
        document.getElementById(
            "planList"
        );


    const data =
        localizedCrop(
            lastAnalyzedCrop
        );


    if (
        !box ||
        !data ||
        !resultBox ||
        resultBox.style.display !==
            "block"
    ) {
        return;
    }


    const p =
        readProfile();


    const acres =
        parseFloat(p.land) || 1;


    const spots =
        Math.min(
            20,
            Math.max(
                5,
                Math.round(acres * 5)
            )
        );


    const s =
        data.suggestions || [];


    const crop =
        data.cropName;


    const planTitle =
        document.getElementById(
            "planTitle"
        );


    if (planTitle) {

        planTitle.textContent =
            safePick(
                p.name
                    ? "Plan for " +
                      p.name +
                      " ji's " +
                      crop.toLowerCase()
                    : "Your " +
                      crop.toLowerCase() +
                      " plan",

                p.name
                    ? p.name +
                      " जी के लिए " +
                      crop +
                      " की योजना"
                    : "आपकी " +
                      crop +
                      " की योजना",

                p.name
                    ? p.name +
                      " जी यांच्यासाठी " +
                      crop +
                      " योजना"
                    : "तुमची " +
                      crop +
                      " योजना"
            );
    }


    const scout =
        safePick(
            "Walk your field in a zigzag and check about " +
                spots +
                " spots" +
                (p.land
                    ? " across your " +
                      p.land +
                      " acres"
                    : "") +
                ". Note where the damage is spreading.",

            "खेत में ज़िगज़ैग चलिए और लगभग " +
                spots +
                " जगह देखिए" +
                (p.land
                    ? " (आपके " +
                      p.land +
                      " एकड़ में)"
                    : "") +
                "। देखिए कि नुकसान कहाँ फैल रहा है।",

            "शेतात नागमोडी चाला आणि सुमारे " +
                spots +
                " ठिकाणी पाहणी करा" +
                (p.land
                    ? " (तुमच्या " +
                      p.land +
                      " एकरात)"
                    : "") +
                ". नुकसान कुठे पसरत आहे ते नोंदवा."
        );


    const waterTip =
        waterTips[p.water] ||
        "Use water according to the crop's needs and avoid unnecessary over-irrigation.";


    const stageTip =
        stageTips[p.stage] ||
        "Monitor the crop regularly and check leaves for changes.";


    const groups = [

        [
            safeTr("Today"),
            [
                s[0],
                safeTr(waterTip)
            ]
        ],

        [
            safeTr("This week"),
            [
                scout,
                safeTr(stageTip),
                s[s.length - 1]
            ]
        ],

        [
            safeTr("To prevent it coming back"),
            [
                s[1],
                s[2]
            ]
        ]
    ];


    box.innerHTML = "";


    groups.forEach(
        function (group) {

            const wrap =
                document.createElement(
                    "div"
                );

            wrap.className =
                "plan-group";


            const title =
                document.createElement(
                    "h5"
                );

            title.textContent =
                group[0];


            const list =
                document.createElement(
                    "ul"
                );


            group[1]
                .filter(Boolean)
                .forEach(
                    function (tip) {

                        const li =
                            document.createElement(
                                "li"
                            );

                        li.textContent =
                            tip;

                        list.appendChild(
                            li
                        );
                    }
                );


            wrap.append(
                title,
                list
            );

            box.appendChild(
                wrap
            );
        }
    );
}


function localizeResult() {

    const d =
        localizedCrop(
            lastAnalyzedCrop
        );


    if (
        !d ||
        !resultBox ||
        resultBox.style.display !==
            "block"
    ) {
        return;
    }


    if (resultCrop) {
        resultCrop.textContent =
            d.cropName;
    }


    if (riskLevel) {
        riskLevel.textContent =
            safeTr(
                cropData[
                    lastAnalyzedCrop
                ].risk
            );
    }


    if (diseaseName) {
        diseaseName.textContent =
            d.disease;
    }


    if (resultDescription) {
        resultDescription.textContent =
            d.description;
    }


    if (symptomsList) {

        symptomsList.innerHTML =
            "";

        (d.symptoms || [])
            .forEach(
                function (text) {

                    const li =
                        document.createElement(
                            "li"
                        );

                    li.textContent =
                        text;

                    symptomsList.appendChild(
                        li
                    );
                }
            );
    }


    if (suggestionsList) {

        suggestionsList.innerHTML =
            "";

        (d.suggestions || [])
            .forEach(
                function (text) {

                    const li =
                        document.createElement(
                            "li"
                        );

                    li.textContent =
                        text;

                    suggestionsList.appendChild(
                        li
                    );
                }
            );
    }
}


/* Profile listeners */

Object.values(profileIds)
    .forEach(function (id) {

        const el =
            document.getElementById(id);

        if (el) {

            el.addEventListener(
                "change",
                saveProfile
            );
        }
    });


loadProfile();


/* =========================================================
   CAMERA
   ========================================================= */

const openCameraBtn =
    document.getElementById(
        "openCameraBtn"
    );

const cameraModal =
    document.getElementById(
        "cameraModal"
    );

const cameraVideo =
    document.getElementById(
        "cameraVideo"
    );

const cameraCanvas =
    document.getElementById(
        "cameraCanvas"
    );

const captureBtn =
    document.getElementById(
        "captureBtn"
    );

const closeCameraBtn =
    document.getElementById(
        "closeCameraBtn"
    );

const cameraFallback =
    document.getElementById(
        "cameraFallback"
    );


let cameraStream = null;


function setCropImage(file) {

    if (
        !file ||
        !cropImage
    ) {
        return;
    }


    try {

        const transfer =
            new DataTransfer();

        transfer.items.add(file);

        cropImage.files =
            transfer.files;

        cropImage.dispatchEvent(
            new Event("change")
        );

    } catch (error) {

        console.error(
            "Could not set camera image:",
            error
        );
    }
}


function stopCamera() {

    if (cameraStream) {

        cameraStream
            .getTracks()
            .forEach(
                function (track) {
                    track.stop();
                }
            );

        cameraStream = null;
    }


    if (cameraVideo) {
        cameraVideo.srcObject =
            null;
    }


    if (cameraModal) {

        cameraModal.classList.remove(
            "active"
        );

        cameraModal.setAttribute(
            "aria-hidden",
            "true"
        );
    }
}


async function openCamera() {

    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {

        if (cameraFallback) {
            cameraFallback.click();
        }

        return;
    }


    try {

        cameraStream =
            await navigator.mediaDevices.getUserMedia({

                video: {
                    facingMode: {
                        ideal: "environment"
                    }
                },

                audio: false
            });


        if (cameraVideo) {
            cameraVideo.srcObject =
                cameraStream;
        }


        if (cameraModal) {

            cameraModal.classList.add(
                "active"
            );

            cameraModal.setAttribute(
                "aria-hidden",
                "false"
            );
        }

    } catch (error) {

        console.error(
            "Camera error:",
            error
        );

        if (analysisMessage) {

            analysisMessage.textContent =
                safeTr(
                    "Camera could not start. Allow camera access in your browser, or use the upload option."
                );
        }
    }
}


function capturePhoto() {

    if (
        !cameraVideo ||
        !cameraCanvas ||
        !cameraVideo.videoWidth
    ) {
        return;
    }


    cameraCanvas.width =
        cameraVideo.videoWidth;

    cameraCanvas.height =
        cameraVideo.videoHeight;


    const context =
        cameraCanvas.getContext(
            "2d"
        );


    if (!context) {
        return;
    }


    context.drawImage(
        cameraVideo,
        0,
        0
    );


    cameraCanvas.toBlob(
        function (blob) {

            if (!blob) {
                return;
            }


            const file =
                new File(
                    [blob],
                    "crop-photo-" +
                        Date.now() +
                        ".jpg",
                    {
                        type:
                            "image/jpeg"
                    }
                );


            setCropImage(
                file
            );

            stopCamera();
        },
        "image/jpeg",
        0.92
    );
}


if (openCameraBtn) {
    openCameraBtn.addEventListener(
        "click",
        openCamera
    );
}


if (captureBtn) {
    captureBtn.addEventListener(
        "click",
        capturePhoto
    );
}


if (closeCameraBtn) {
    closeCameraBtn.addEventListener(
        "click",
        stopCamera
    );
}


if (cameraModal) {

    cameraModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                cameraModal
            ) {
                stopCamera();
            }
        }
    );
}


document.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Escape") {
            stopCamera();
        }
    }
);


if (cameraFallback) {

    cameraFallback.addEventListener(
        "change",
        function () {

            if (
                cameraFallback.files &&
                cameraFallback.files[0]
            ) {

                setCropImage(
                    cameraFallback.files[0]
                );
            }
        }
    );
}


/* =========================================================
   LANGUAGE + RISK
   ========================================================= */

const languageSelect =
    document.getElementById(
        "languageSelect"
    );

const riskDetailsBtn =
    document.getElementById(
        "riskDetailsBtn"
    );

const riskDetails =
    document.getElementById(
        "riskDetails"
    );


const RISK_TEXT =
    "High humidity helps fungal diseases spread. Avoid overhead watering and check leaves every day.";


if (
    riskDetailsBtn &&
    riskDetails
) {

    riskDetailsBtn.addEventListener(
        "click",
        function () {

            const open =
                riskDetails.dataset.open ===
                "1";


            riskDetails.dataset.open =
                open
                    ? "0"
                    : "1";


            riskDetails.textContent =
                open
                    ? ""
                    : safeTr(
                        RISK_TEXT
                    );
        }
    );
}


/* =========================================================
   HINDI CHATBOT
   ========================================================= */

function getBotResponseHi(text) {

    if (
        /\bhi\b|hello|namaste|नमस्ते|नमस्कार/
            .test(text)
    ) {

        return "नमस्ते भाई! 🌱 बताइए, आपकी फसल के बारे में क्या मदद चाहिए?";
    }


    if (
        /tomato|टमाटर/.test(text)
    ) {

        return "टमाटर के पत्तों पर धब्बे हैं? 🌿 फोटो अपलोड करके नमूना जाँच देखिए। असली इलाज से पहले कृषि विशेषज्ञ से पक्का कर लीजिए।";
    }


    if (
        /disease|रोग|बीमारी/.test(text)
    ) {

        return "फसल के रोग के लिए प्रभावित पत्ते की साफ़ फोटो लीजिए, फसल चुनिए और 'फसल की जाँच करें' दबाइए।";
    }


    if (
        /weather|मौसम/.test(text)
    ) {

        return "ज़्यादा नमी और लगातार बारिश से कुछ फसल रोगों का खतरा बढ़ सकता है। डैशबोर्ड में जोखिम अलर्ट देखिए।";
    }


    if (
        /water|पानी/.test(text)
    ) {

        return "फसल को ज़रूरत के हिसाब से ही पानी दीजिए। ज़्यादा पानी से जड़ और पत्तों को नुकसान हो सकता है।";
    }


    if (
        /help|madad|मदद/.test(text)
    ) {

        return "मैं फसल चुनने, नमूना जाँच, मौसम के जोखिम और फसल की देखभाल की बुनियादी जानकारी में मदद कर सकता हूँ। 🌾";
    }


    return "भाई, मैं अभी डेमो सहायक हूँ। आप फसल का नाम, रोग, मौसम या खेती की देखभाल के बारे में पूछ सकते हैं। 🌱";
}


/* =========================================================
   MARATHI CHATBOT
   ========================================================= */

function getBotResponseMr(text) {

    if (
        /\bhi\b|hello|namaste|नमस्कार|नमस्ते/
            .test(text)
    ) {

        return "नमस्कार भाऊ! 🌱 सांगा, तुमच्या पिकाबद्दल काय मदत हवी आहे?";
    }


    if (
        /tomato|टोमॅटो/.test(text)
    ) {

        return "टोमॅटोच्या पानांवर डाग दिसत आहेत का? 🌿 फोटो अपलोड करून नमुना तपासणी पहा. खऱ्या उपचारापूर्वी कृषी तज्ज्ञांकडून खात्री करून घ्या.";
    }


    if (
        /disease|रोग|बीमारी/.test(text)
    ) {

        return "पिकाच्या रोगासाठी प्रभावित पानाचा स्पष्ट फोटो घ्या, पीक निवडा आणि 'पिकाची तपासणी करा' दाबा.";
    }


    if (
        /weather|हवामान|मौसम/.test(text)
    ) {

        return "जास्त आर्द्रता आणि सततच्या पावसामुळे काही पिकांच्या रोगांचा धोका वाढू शकतो. डॅशबोर्डवर धोक्याचा इशारा पहा.";
    }


    if (
        /water|पाणी/.test(text)
    ) {

        return "पिकाला गरजेनुसारच पाणी द्या. जास्त पाण्यामुळे मुळांना आणि पानांना नुकसान होऊ शकते.";
    }


    if (
        /help|madad|मदत/.test(text)
    ) {

        return "मी पीक निवडणे, नमुना तपासणी, हवामानाचा धोका आणि पिकाची काळजी याबद्दल मूलभूत माहिती देऊन मदत करू शकतो. 🌾";
    }


    return "भाऊ, मी सध्या डेमो सहाय्यक आहे. तुम्ही पिकाचे नाव, रोग, हवामान किंवा शेतीच्या काळजीबद्दल विचारू शकता. 🌱";
}


/* =========================================================
   LANGUAGE CHANGE
   ========================================================= */

const previousLanguageChange =
    window.onLanguageChange;


window.onLanguageChange =
    function (lang) {

        if (
            typeof previousLanguageChange ===
            "function"
        ) {
            previousLanguageChange(
                lang
            );
        }


        if (
            typeof renderWeather ===
            "function"
        ) {
            renderWeather();
        }


        if (
            "speechSynthesis" in
            window
        ) {
            window.speechSynthesis.cancel();
        }


        if (
            typeof listenBtn !==
            "undefined" &&
            listenBtn
        ) {
            listenBtn.classList.remove(
                "speaking"
            );
        }


        if (
            typeof voiceNote !==
            "undefined" &&
            voiceNote
        ) {
            voiceNote.textContent =
                "";
        }
    };


if (languageSelect) {

    languageSelect.addEventListener(
        "change",
        function () {

            if (
                typeof setLanguage ===
                "function"
            ) {

                setLanguage(
                    languageSelect.value
                );
            }
        }
    );


    languageSelect.value =
        safeCurrentLang();
}


/* =========================================================
   MOBILE MENU
   ========================================================= */

const siteNav =
    document.querySelector(
        ".navbar"
    );

const siteNavToggle =
    document.getElementById(
        "navToggle"
    );


function setMenu(open) {

    if (!siteNav) {
        return;
    }


    siteNav.classList.toggle(
        "open",
        open
    );


    if (siteNavToggle) {

        siteNavToggle.setAttribute(
            "aria-expanded",
            String(open)
        );
    }
}


if (siteNavToggle) {

    siteNavToggle.addEventListener(
        "click",
        function () {

            setMenu(
                !siteNav.classList.contains(
                    "open"
                )
            );
        }
    );
}


if (siteNav) {

    siteNav
        .querySelectorAll(
            ".nav-links a, .login-btn"
        )
        .forEach(
            function (el) {

                el.addEventListener(
                    "click",
                    function () {
                        setMenu(false);
                    }
                );
            }
        );
}


document.addEventListener(
    "click",
    function (event) {

        if (
            siteNav &&
            !siteNav.contains(
                event.target
            )
        ) {
            setMenu(false);
        }
    }
);


window.addEventListener(
    "resize",
    function () {

        if (
            window.innerWidth >
            900
        ) {
            setMenu(false);
        }
    }
);


/* =========================================================
   NEON TAP GLOW
   ========================================================= */

const NEON_TARGETS =
    ".feature-icon, .dashboard-icon, .login-icon, .brand-icon, .chatbot-toggle";


document.addEventListener(
    "pointerdown",
    function (event) {

        const hit =
            event.target.closest(
                NEON_TARGETS +
                ", .feature-card, .dashboard-card"
            );


        if (!hit) {
            return;
        }


        const icon =
            hit.matches(
                NEON_TARGETS
            )
                ? hit
                : hit.querySelector(
                    NEON_TARGETS
                );


        if (!icon) {
            return;
        }


        icon.classList.add(
            "glow-pulse"
        );


        clearTimeout(
            icon._glowTimer
        );


        icon._glowTimer =
            setTimeout(
                function () {

                    icon.classList.remove(
                        "glow-pulse"
                    );

                },
                900
            );
    }
);


/* =========================================================
   LIVE WEATHER - OPEN METEO
   ========================================================= */

const weatherBadge =
    document.getElementById(
        "weatherBadge"
    );

const weatherTemp =
    document.getElementById(
        "weatherTemp"
    );

const weatherDesc =
    document.getElementById(
        "weatherDesc"
    );

const weatherHumidity =
    document.getElementById(
        "weatherHumidity"
    );

const weatherWind =
    document.getElementById(
        "weatherWind"
    );

const weatherPlace =
    document.getElementById(
        "weatherPlace"
    );

const weatherActivity =
    document.getElementById(
        "weatherActivity"
    );

const riskBadge =
    document.getElementById(
        "riskBadge"
    );

const riskValue =
    document.getElementById(
        "riskValue"
    );

const riskText =
    document.getElementById(
        "riskText"
    );

const useLocationBtn =
    document.getElementById(
        "useLocationBtn"
    );


const DEFAULT_PLACE = {
    lat: 18.5204,
    lon: 73.8567
};


const GEO_KEY =
    "agrishieldGeo";


let lastWeather = null;
let geoPlace = "";


const WEATHER_TEXT = {

    clear: [
        "Clear sky",
        "साफ़ आसमान",
        "निरभ्र आकाश"
    ],

    partly: [
        "Partly cloudy",
        "आंशिक रूप से बादल",
        "अंशतः ढगाळ"
    ],

    cloudy: [
        "Cloudy",
        "बादल छाए हैं",
        "ढगाळ"
    ],

    fog: [
        "Foggy",
        "कोहरा",
        "धुके"
    ],

    drizzle: [
        "Light drizzle",
        "हल्की बूंदाबांदी",
        "हलकी रिमझिम"
    ],

    rain: [
        "Rain",
        "बारिश",
        "पाऊस"
    ],

    storm: [
        "Thunderstorm",
        "आंधी और बिजली के साथ बारिश",
        "वादळी पाऊस"
    ]
};


function weatherGroup(code) {

    if (code === 0) {
        return "clear";
    }

    if (code <= 2) {
        return "partly";
    }

    if (code === 3) {
        return "cloudy";
    }

    if (
        code === 45 ||
        code === 48
    ) {
        return "fog";
    }

    if (
        code >= 51 &&
        code <= 57
    ) {
        return "drizzle";
    }

    if (
        (
            code >= 61 &&
            code <= 67
        ) ||
        (
            code >= 80 &&
            code <= 82
        )
    ) {
        return "rain";
    }

    if (code >= 95) {
        return "storm";
    }

    return "cloudy";
}


function weatherRiskLevel(w) {

    const wet =
        [
            "drizzle",
            "rain",
            "storm"
        ].includes(
            weatherGroup(w.code)
        );


    if (
        w.humidity >= 80 ||
        (
            wet &&
            w.humidity >= 65
        )
    ) {
        return "High";
    }


    if (
        w.humidity >= 65 ||
        wet
    ) {
        return "Medium";
    }


    return "Low";
}


function renderWeather() {

    if (
        !lastWeather
    ) {
        return;
    }


    const w =
        lastWeather;


    const idxMap = {
        en: 0,
        hi: 1,
        mr: 2
    };


    const idx =
        idxMap[
            safeCurrentLang()
        ] ?? 0;


    if (weatherBadge) {

        weatherBadge.textContent =
            safePick(
                "Live",
                "लाइव",
                "थेट"
            );

        weatherBadge.classList.add(
            "healthy"
        );
    }


    if (weatherTemp) {

        weatherTemp.textContent =
            Math.round(
                w.temp
            ) +
            "°C";
    }


    if (weatherDesc) {

        const group =
            weatherGroup(
                w.code
            );

        weatherDesc.textContent =
            WEATHER_TEXT[
                group
            ][idx];
    }


    if (weatherHumidity) {

        weatherHumidity.textContent =
            safePick(
                "💧 Humidity: ",
                "💧 नमी: ",
                "💧 आर्द्रता: "
            ) +
            Math.round(
                w.humidity
            ) +
            "%";
    }


    if (weatherWind) {

        weatherWind.textContent =
            safePick(
                "💨 Wind: ",
                "💨 हवा: ",
                "💨 वारा: "
            ) +
            Math.round(
                w.wind
            ) +
            safePick(
                " km/h",
                " किमी/घंटा",
                " किमी/तास"
            );
    }


    if (w.isDefault) {

        if (weatherPlace) {

            weatherPlace.textContent =
                "📍 " +
                safePick(
                    "Pune (default)",
                    "पुणे (डिफ़ॉल्ट)",
                    "पुणे (डिफॉल्ट)"
                );
        }


        if (weatherActivity) {

            weatherActivity.textContent =
                safePick(
                    "Live weather for Pune. Tap 'Use my location' for your area.",

                    "पुणे का लाइव मौसम। अपने इलाके के लिए 'मेरी लोकेशन इस्तेमाल करें' दबाइए।",

                    "पुण्याचे थेट हवामान. तुमच्या भागासाठी 'माझे ठिकाण वापरा' दाबा."
                );
        }

    } else {

        if (weatherPlace) {

            weatherPlace.textContent =
                "📍 " +
                (
                    geoPlace ||
                    safePick(
                        "Your location",
                        "आपकी लोकेशन",
                        "तुमचे ठिकाण"
                    )
                );
        }


        if (weatherActivity) {

            weatherActivity.textContent =
                safeTr(
                    "Live weather from your location."
                );
        }
    }


    const level =
        weatherRiskLevel(
            w
        );


    if (riskValue) {

        riskValue.textContent =
            safeTr(level);
    }


    if (riskBadge) {

        riskBadge.className =
            "status-badge " +
            (
                level === "Low"
                    ? "healthy"
                    : level === "Medium"
                        ? "warning"
                        : "danger"
            );


        riskBadge.textContent =
            level === "Low"
                ? safePick(
                    "Low",
                    "कम",
                    "कमी"
                )
                : level === "Medium"
                    ? safePick(
                        "Moderate",
                        "मध्यम",
                        "मध्यम"
                    )
                    : safePick(
                        "High",
                        "उच्च",
                        "जास्त"
                    );
    }


    if (riskText) {

        riskText.textContent =
            level === "High"

                ? safePick(
                    "High humidity or rain. Diseases can spread fast.",
                    "ज़्यादा नमी या बारिश। रोग तेज़ी से फैल सकते हैं।",
                    "जास्त आर्द्रता किंवा पाऊस. रोग वेगाने पसरू शकतात."
                )

                : level === "Medium"

                    ? safeTr(
                        "Humidity may increase disease risk."
                    )

                    : safePick(
                        "Dry weather. Disease risk is low today.",
                        "मौसम सूखा है। आज रोग का खतरा कम है।",
                        "हवामान कोरडे आहे. आज रोगाचा धोका कमी आहे."
                    );
    }
}


function fetchWeather(
    lat,
    lon,
    isDefault
) {

    const url =
        "https://api.open-meteo.com/v1/forecast" +
        "?latitude=" +
        encodeURIComponent(lat) +
        "&longitude=" +
        encodeURIComponent(lon) +
        "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code" +
        "&timezone=auto";


    fetch(url)

        .then(function (response) {

            if (!response.ok) {
                throw new Error(
                    "Weather request failed"
                );
            }

            return response.json();
        })

        .then(function (data) {

            const c =
                data.current;


            if (!c) {
                return;
            }


            lastWeather = {

                temp:
                    c.temperature_2m,

                humidity:
                    c.relative_humidity_2m,

                wind:
                    c.wind_speed_10m,

                code:
                    c.weather_code,

                isDefault:
                    isDefault
            };


            renderWeather();
        })

        .catch(function (error) {

            console.error(
                "Weather error:",
                error
            );
        });
}


function reverseGeocode(
    lat,
    lon
) {

    const url =
        "https://api.bigdatacloud.net/data/reverse-geocode-client" +
        "?latitude=" +
        encodeURIComponent(lat) +
        "&longitude=" +
        encodeURIComponent(lon) +
        "&localityLanguage=en";


    fetch(url)

        .then(function (response) {

            if (!response.ok) {
                throw new Error(
                    "Reverse geocoding failed"
                );
            }

            return response.json();
        })

        .then(function (data) {

            geoPlace =
                data.city ||
                data.locality ||
                data.principalSubdivision ||
                "";

            renderWeather();
        })

        .catch(function (error) {

            console.warn(
                "Reverse geocoding error:",
                error
            );
        });
}


function requestLocation() {

    if (!navigator.geolocation) {

        if (weatherActivity) {

            weatherActivity.textContent =
                safePick(
                    "Location is not supported in this browser.",
                    "इस ब्राउज़र में लोकेशन की सुविधा नहीं है।",
                    "या ब्राउझरमध्ये ठिकाणाची सुविधा नाही."
                );
        }

        return;
    }


    navigator.geolocation.getCurrentPosition(

        function (position) {

            try {

                localStorage.setItem(
                    GEO_KEY,
                    "1"
                );

            } catch (e) {}


            fetchWeather(
                position.coords.latitude,
                position.coords.longitude,
                false
            );


            reverseGeocode(
                position.coords.latitude,
                position.coords.longitude
            );
        },


        function () {

            if (weatherActivity) {

                weatherActivity.textContent =
                    safePick(
                        "Location permission was not given. Showing Pune weather.",
                        "लोकेशन की अनुमति नहीं मिली। पुणे का मौसम दिखा रहे हैं।",
                        "ठिकाणाची परवानगी मिळाली नाही. पुण्याचे हवामान दाखवत आहोत."
                    );
            }


            if (!lastWeather) {

                fetchWeather(
                    DEFAULT_PLACE.lat,
                    DEFAULT_PLACE.lon,
                    true
                );
            }
        },


        {
            timeout: 10000,
            maximumAge: 600000
        }
    );
}


if (useLocationBtn) {

    useLocationBtn.addEventListener(
        "click",
        requestLocation
    );
}


/* Start default weather */

fetchWeather(
    DEFAULT_PLACE.lat,
    DEFAULT_PLACE.lon,
    true
);


/* =========================================================
   VOICE
   ========================================================= */

const micBtn =
    document.getElementById(
        "micBtn"
    );

const listenBtn =
    document.getElementById(
        "listenBtn"
    );

const voiceNote =
    document.getElementById(
        "voiceNote"
    );


const VOICE_LANG = {

    en: "en-IN",
    hi: "hi-IN",
    mr: "mr-IN"
};


const SpeechRec =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


let recognizer = null;


function speakText(
    text,
    button
) {

    if (
        !(
            "speechSynthesis" in
            window
        )
    ) {
        return false;
    }


    const lang =
        VOICE_LANG[
            safeCurrentLang()
        ] || "en-IN";


    const voices =
        window.speechSynthesis
            .getVoices();


    const voice =
        voices.find(
            function (v) {

                return v.lang
                    .replace("_", "-")
                    .toLowerCase() ===
                    lang.toLowerCase();
            }
        ) ||

        voices.find(
            function (v) {

                return v.lang
                    .toLowerCase()
                    .indexOf(
                        lang
                            .slice(0, 2)
                            .toLowerCase()
                    ) === 0;
            }
        );


    if (
        voices.length &&
        !voice &&
        lang !== "en-IN"
    ) {

        if (voiceNote) {

            voiceNote.textContent =
                safePick(
                    "",
                    "इस डिवाइस पर हिंदी आवाज़ उपलब्ध नहीं है।",
                    "या डिव्हाइसवर मराठी आवाज उपलब्ध नाही."
                );
        }

        return false;
    }


    window.speechSynthesis.cancel();


    const utterance =
        new SpeechSynthesisUtterance(
            text
        );


    utterance.lang =
        lang;


    if (voice) {
        utterance.voice =
            voice;
    }


    utterance.rate =
        0.95;


    if (button) {

        button.classList.add(
            "speaking"
        );


        utterance.onend =
            utterance.onerror =
            function () {

                button.classList.remove(
                    "speaking"
                );
            };
    }


    if (voiceNote) {
        voiceNote.textContent =
            "";
    }


    window.speechSynthesis.speak(
        utterance
    );


    return true;
}


function reportSpeech() {

    const d =
        localizedCrop(
            lastAnalyzedCrop
        );


    if (
        !d ||
        !resultBox ||
        resultBox.style.display !==
            "block"
    ) {
        return "";
    }


    const risk =
        safeTr(
            cropData[
                lastAnalyzedCrop
            ].risk
        );


    return safePick(

        d.cropName +
            ". Possible problem: " +
            d.disease +
            ". Risk level: " +
            risk +
            ". What to do: " +
            d.suggestions[0] +
            ". " +
            d.suggestions[1] +
            ". Please also check with an agriculture expert.",


        d.cropName +
            "। संभावित समस्या: " +
            d.disease +
            "। जोखिम स्तर: " +
            risk +
            "। क्या करें: " +
            d.suggestions[0] +
            "। " +
            d.suggestions[1] +
            "। कृपया कृषि विशेषज्ञ से भी सलाह लीजिए।",


        d.cropName +
            ". संभाव्य समस्या: " +
            d.disease +
            ". धोक्याची पातळी: " +
            risk +
            ". काय करावे: " +
            d.suggestions[0] +
            ". " +
            d.suggestions[1] +
            ". कृपया कृषी तज्ज्ञांचाही सल्ला घ्या."
    );
}


if (listenBtn) {

    listenBtn.addEventListener(
        "click",
        function () {

            if (
                !(
                    "speechSynthesis" in
                    window
                )
            ) {

                if (voiceNote) {

                    voiceNote.textContent =
                        safePick(
                            "Voice is not supported in this browser.",
                            "इस ब्राउज़र में आवाज़ की सुविधा नहीं है।",
                            "या ब्राउझरमध्ये आवाजाची सुविधा नाही."
                        );
                }

                return;
            }


            if (
                window.speechSynthesis
                    .speaking
            ) {

                window.speechSynthesis.cancel();

                listenBtn.classList.remove(
                    "speaking"
                );

                return;
            }


            const text =
                reportSpeech();


            if (text) {
                speakText(
                    text,
                    listenBtn
                );
            }
        }
    );
}


/* =========================================================
   SPEECH RECOGNITION
   ========================================================= */

if (!SpeechRec) {

    if (micBtn) {
        micBtn.style.display =
            "none";
    }

} else if (micBtn) {

    micBtn.addEventListener(
        "click",
        function () {

            if (recognizer) {

                recognizer.stop();

                return;
            }


            recognizer =
                new SpeechRec();


            recognizer.lang =
                VOICE_LANG[
                    safeCurrentLang()
                ] || "en-IN";


            recognizer.interimResults =
                false;


            recognizer.maxAlternatives =
                1;


            micBtn.classList.add(
                "listening"
            );


            recognizer.onresult =
                function (event) {

                    if (!chatInput) {
                        return;
                    }


                    chatInput.value =
                        event.results[0][0]
                            .transcript;


                    speakNextReply =
                        true;


                    sendChatMessage();
                };


            recognizer.onerror =
                function (event) {

                    console.error(
                        "Speech recognition error:",
                        event
                    );


                    addChatMessage(
                        safePick(
                            "Could not hear you. Please try again.",
                            "आवाज़ सुनाई नहीं दी। कृपया फिर से बोलिए।",
                            "आवाज ऐकू आला नाही. कृपया पुन्हा बोला."
                        ),
                        "bot"
                    );
                };


            recognizer.onend =
                function () {

                    micBtn.classList.remove(
                        "listening"
                    );

                    recognizer =
                        null;
                };


            try {

                recognizer.start();

            } catch (error) {

                console.error(
                    "Speech start error:",
                    error
                );

                recognizer =
                    null;

                micBtn.classList.remove(
                    "listening"
                );
            }
        }
    );
}


/* =========================================================
   THEME TOGGLE
   ========================================================= */

const THEME_KEY =
    "agrishieldTheme";


const themeToggle =
    document.getElementById(
        "themeToggle"
    );


function applyTheme(theme) {

    theme =
        theme === "light"
            ? "light"
            : "dark";


    document.documentElement
        .setAttribute(
            "data-theme",
            theme
        );


    try {

        localStorage.setItem(
            THEME_KEY,
            theme
        );

    } catch (e) {}
}


(function initTheme() {

    let saved = null;


    try {

        saved =
            localStorage.getItem(
                THEME_KEY
            );

    } catch (e) {}


    if (!saved) {

        saved =
            (
                window.matchMedia &&
                window.matchMedia(
                    "(prefers-color-scheme: light)"
                ).matches
            )
                ? "light"
                : "dark";
    }


    applyTheme(
        saved
    );

})();


if (themeToggle) {

    themeToggle.addEventListener(
        "click",
        function () {

            const current =
                document.documentElement
                    .getAttribute(
                        "data-theme"
                    ) === "light"
                    ? "light"
                    : "dark";


            applyTheme(
                current === "light"
                    ? "dark"
                    : "light"
            );
        }
    );
}


/* =========================================================
   INITIALIZE
   ========================================================= */

checkAuthUser();
renderHistory();


console.log(
    "🌱 AgriShield AI JavaScript loaded successfully."
);
const brandLogo = document.querySelector(".brand-logo");

if (brandLogo) {
    brandLogo.addEventListener("click", () => {
        brandLogo.classList.remove("logo-click");

        void brandLogo.offsetWidth;

        brandLogo.classList.add("logo-click");

        setTimeout(() => {
            brandLogo.classList.remove("logo-click");
        }, 700);
    });
}
/* =========================================================
   AGRISHIELD PROFESSIONAL ACCOUNT SYSTEM
   ========================================================= */

(function initProfessionalAccount() {

    if (!document.body) {
        return;
    }


    /* -----------------------------------------------------
       CREATE ACCOUNT PANEL
    ----------------------------------------------------- */

    const accountPanel =
        document.createElement("div");

    accountPanel.id =
        "agrishieldAccountPanel";

    accountPanel.className =
        "agrishield-account-panel";

    accountPanel.innerHTML = `

        <div class="account-panel-header">

            <div class="account-avatar" id="accountAvatar">
                A
            </div>

            <div class="account-main-info">

                <strong id="accountName">
                    AgriShield Farmer
                </strong>

                <span id="accountEmail">
                    Loading...
                </span>

            </div>

            <button
                type="button"
                class="account-close"
                id="accountClose"
                aria-label="Close account menu"
            >
                ×
            </button>

        </div>


        <div class="account-status">
            <span class="status-dot"></span>
            <span>Account active</span>
        </div>


        <div class="account-menu">

            <button
                type="button"
                data-account-action="profile"
            >
                <span>👤</span>
                <span>My Profile</span>
            </button>


            <button
                type="button"
                data-account-action="reports"
            >
                <span>📄</span>
                <span>My Reports</span>
            </button>


            <button
                type="button"
                data-account-action="settings"
            >
                <span>⚙️</span>
                <span>Settings</span>
            </button>

        </div>


        <div class="account-settings" id="accountSettings">

            <div class="settings-title">
                <span>⚙️</span>
                <strong>Settings</strong>
            </div>


            <label class="settings-row">

                <span>
                    <small>Language</small>
                </span>

                <select id="profileLanguageSelect">

                    <option value="en">
                        English
                    </option>

                    <option value="hi">
                        हिन्दी
                    </option>

                    <option value="mr">
                        मराठी
                    </option>

                </select>

            </label>


            <label class="settings-row">

                <span>
                    <small>Appearance</small>
                </span>

                <button
                    type="button"
                    id="profileThemeBtn"
                    class="settings-theme-btn"
                >
                    Dark
                </button>

            </label>


            <label class="settings-input">

                <span>Farmer name</span>

                <input
                    type="text"
                    id="profileAccountName"
                    placeholder="Enter your name"
                >

            </label>


            <button
                type="button"
                id="saveAccountProfile"
                class="save-profile-btn"
            >
                Save Profile
            </button>

        </div>


        <button
            type="button"
            id="accountLogoutBtn"
            class="account-logout"
        >
            <span>↪</span>
            Logout
        </button>

    `;


    document.body.appendChild(
        accountPanel
    );


    /* -----------------------------------------------------
       ELEMENTS
    ----------------------------------------------------- */

    const accountAvatar =
        document.getElementById(
            "accountAvatar"
        );

    const accountName =
        document.getElementById(
            "accountName"
        );

    const accountEmail =
        document.getElementById(
            "accountEmail"
        );

    const accountClose =
        document.getElementById(
            "accountClose"
        );

    const accountSettings =
        document.getElementById(
            "accountSettings"
        );

    const profileLanguageSelect =
        document.getElementById(
            "profileLanguageSelect"
        );

    const profileThemeBtn =
        document.getElementById(
            "profileThemeBtn"
        );

    const profileAccountName =
        document.getElementById(
            "profileAccountName"
        );

    const saveAccountProfile =
        document.getElementById(
            "saveAccountProfile"
        );

    const accountLogoutBtn =
        document.getElementById(
            "accountLogoutBtn"
        );


    /* -----------------------------------------------------
       OPEN / CLOSE
    ----------------------------------------------------- */

    function openAccountPanel() {

        accountPanel.classList.add(
            "active"
        );

        loadAccountData();
    }


    function closeAccountPanel() {

        accountPanel.classList.remove(
            "active"
        );

        accountSettings.classList.remove(
            "active"
        );
    }


    if (accountClose) {

        accountClose.addEventListener(
            "click",
            closeAccountPanel
        );
    }


    document.addEventListener(
        "click",
        function (event) {

            if (
                accountPanel.classList.contains(
                    "active"
                ) &&
                !accountPanel.contains(
                    event.target
                ) &&
                event.target !== openLoginBtn
            ) {

                closeAccountPanel();
            }
        }
    );


    /* -----------------------------------------------------
       ACCOUNT BUTTON
    ----------------------------------------------------- */

    if (openLoginBtn) {

        openLoginBtn.addEventListener(
            "click",
            async function (event) {

                event.preventDefault();

                const user =
                    await getCurrentUser();

                if (user) {

                    openAccountPanel();

                } else {

                    openLoginModal();
                }

            }
        );
    }


    /* -----------------------------------------------------
       LOAD ACCOUNT DATA
    ----------------------------------------------------- */

    async function loadAccountData() {

        const user =
            await getCurrentUser();


        if (!user) {
            return;
        }


        const metadata =
            user.user_metadata || {};


        const fullName =
            metadata.full_name ||
            metadata.name ||
            localStorage.getItem(
                "agrishieldFarmerName"
            ) ||
            "AgriShield Farmer";


        if (accountName) {
            accountName.textContent =
                fullName;
        }


        if (accountEmail) {
            accountEmail.textContent =
                user.email || "";
        }


        if (accountAvatar) {

            accountAvatar.textContent =
                fullName
                    .charAt(0)
                    .toUpperCase();
        }


        if (profileAccountName) {

            profileAccountName.value =
                fullName === "AgriShield Farmer"
                    ? ""
                    : fullName;
        }


        if (profileLanguageSelect) {

            profileLanguageSelect.value =
                safeCurrentLang();
        }


        updateThemeButton();
    }


    /* -----------------------------------------------------
       SETTINGS BUTTONS
    ----------------------------------------------------- */

    accountPanel
        .querySelectorAll(
            "[data-account-action]"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const action =
                            button.dataset.accountAction;


                        if (action === "settings") {

                            accountSettings.classList.toggle(
                                "active"
                            );

                        }


                        if (action === "reports") {

                            closeAccountPanel();

                            const history =
                                document.getElementById(
                                    "historyPanel"
                                );

                            if (history) {

                                history.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start"
                                });
                            }

                            renderHistory();
                        }


                        if (action === "profile") {

                            accountSettings.classList.add(
                                "active"
                            );

                            if (profileAccountName) {
                                profileAccountName.focus();
                            }
                        }

                    }
                );
            }
        );


    /* -----------------------------------------------------
       LANGUAGE
    ----------------------------------------------------- */

    if (profileLanguageSelect) {

        profileLanguageSelect.addEventListener(
            "change",
            function () {

                const lang =
                    profileLanguageSelect.value;


                if (
                    typeof setLanguage ===
                    "function"
                ) {

                    setLanguage(
                        lang
                    );
                }


                if (languageSelect) {

                    languageSelect.value =
                        lang;
                }

            }
        );
    }


    /* -----------------------------------------------------
       THEME
    ----------------------------------------------------- */

    function updateThemeButton() {

        if (!profileThemeBtn) {
            return;
        }


        const theme =
            document.documentElement
                .getAttribute(
                    "data-theme"
                );


        profileThemeBtn.textContent =
            theme === "light"
                ? "☀️ Light"
                : "🌙 Dark";
    }


    if (profileThemeBtn) {

        profileThemeBtn.addEventListener(
            "click",
            function () {

                const current =
                    document.documentElement
                        .getAttribute(
                            "data-theme"
                        ) === "light"
                        ? "light"
                        : "dark";


                applyTheme(
                    current === "light"
                        ? "dark"
                        : "light"
                );


                updateThemeButton();
            }
        );
    }


    /* -----------------------------------------------------
       SAVE PROFILE
    ----------------------------------------------------- */

    if (saveAccountProfile) {

        saveAccountProfile.addEventListener(
            "click",
            async function () {

                const name =
                    profileAccountName
                        ? profileAccountName.value.trim()
                        : "";


                const user =
                    await getCurrentUser();


                if (!user) {
                    return;
                }


                try {

                    const {
                        error
                    } =
                        await supabaseClient.auth.updateUser({
                            data: {
                                full_name:
                                    name
                            }
                        });


                    if (error) {
                        throw error;
                    }


                    localStorage.setItem(
                        "agrishieldFarmerName",
                        name
                    );


                    if (accountName) {

                        accountName.textContent =
                            name ||
                            "AgriShield Farmer";
                    }


                    if (accountAvatar) {

                        accountAvatar.textContent =
                            (
                                name ||
                                "A"
                            )
                                .charAt(0)
                                .toUpperCase();
                    }


                    if (
                        profileIds.name
                    ) {

                        const farmerInput =
                            document.getElementById(
                                profileIds.name
                            );

                        if (farmerInput) {

                            farmerInput.value =
                                name;
                        }

                        saveProfile();
                    }


                    saveAccountProfile.textContent =
                        "✓ Saved";


                    setTimeout(
                        function () {

                            saveAccountProfile.textContent =
                                "Save Profile";

                        },
                        1500
                    );


                } catch (error) {

                    console.error(
                        "Profile update error:",
                        error
                    );

                    alert(
                        "Could not update profile."
                    );
                }
            }
        );
    }


    /* -----------------------------------------------------
       LOGOUT
    ----------------------------------------------------- */

    if (accountLogoutBtn) {

        accountLogoutBtn.addEventListener(
            "click",
            async function () {

                if (!supabaseClient) {
                    return;
                }


                try {

                    await supabaseClient.auth.signOut();

                    closeAccountPanel();

                    if (openLoginBtn) {

                        openLoginBtn.textContent =
                            "Sign in";
                    }


                    await renderHistory();

                } catch (error) {

                    console.error(
                        "Logout error:",
                        error
                    );
                }
            }
        );
    }


    /* -----------------------------------------------------
       INITIAL ACCOUNT STATE
    ----------------------------------------------------- */

    loadAccountData();

})();
/* =========================================================
   PROFESSIONAL PDF REPORT
   ========================================================= */

async function loadPDFLibrary() {

    if (
        window.jspdf &&
        window.jspdf.jsPDF
    ) {
        return true;
    }


    return new Promise(
        function (resolve) {

            const script =
                document.createElement(
                    "script"
                );

            script.src =
                "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";


            script.onload =
                function () {
                    resolve(true);
                };


            script.onerror =
                function () {
                    resolve(false);
                };


            document.head.appendChild(
                script
            );
        }
    );
}


async function downloadReportPDF(report) {

    const loaded =
        await loadPDFLibrary();


    if (!loaded) {

        alert(
            "PDF system could not load. Please check your internet connection."
        );

        return;
    }


    const {
        jsPDF
    } = window.jspdf;


    const doc =
        new jsPDF();


    const margin =
        20;


    let y =
        20;


    doc.setFontSize(22);

    doc.setFont(undefined, "bold");

    doc.text(
        "AgriShield AI",
        margin,
        y
    );


    y += 9;


    doc.setFontSize(11);

    doc.setFont(undefined, "normal");

    doc.text(
        "Smart Crop Detection & Analysis Report",
        margin,
        y
    );


    y += 15;


    doc.setFontSize(10);


    function addLine(
        label,
        value
    ) {

        doc.setFont(
            undefined,
            "bold"
        );

        doc.text(
            label,
            margin,
            y
        );


        doc.setFont(
            undefined,
            "normal"
        );


        const text =
            String(
                value || "-"
            );


        doc.text(
            text,
            margin + 42,
            y
        );


        y += 8;
    }


    addLine(
        "Report ID:",
        report.report_id
    );


    addLine(
        "Date:",
        report.created_at
            ? new Date(
                report.created_at
            ).toLocaleString(
                "en-IN"
            )
            : report.analysis_time
    );


    addLine(
        "Farmer:",
        report.farmer_name
    );


    addLine(
        "Crop:",
        report.crop
    );


    addLine(
        "Disease:",
        report.disease
    );


    addLine(
        "Risk:",
        report.risk_level
    );


    addLine(
        "Confidence:",
        report.confidence
    );


    y += 5;


    doc.setFont(
        undefined,
        "bold"
    );

    doc.text(
        "Analysis Summary",
        margin,
        y
    );


    y += 7;


    doc.setFont(
        undefined,
        "normal"
    );


    const descriptionLines =
        doc.splitTextToSize(
            report.description ||
            "No description available.",
            170
        );


    doc.text(
        descriptionLines,
        margin,
        y
    );


    y +=
        descriptionLines.length *
        5 +
        10;


    function addListSection(
        title,
        items
    ) {

        if (
            y >
            255
        ) {

            doc.addPage();

            y = 20;
        }


        doc.setFont(
            undefined,
            "bold"
        );


        doc.text(
            title,
            margin,
            y
        );


        y += 7;


        doc.setFont(
            undefined,
            "normal"
        );


        (
            Array.isArray(items)
                ? items
                : []
        ).forEach(
            function (item) {

                const lines =
                    doc.splitTextToSize(
                        "• " +
                        String(item),
                        170
                    );


                doc.text(
                    lines,
                    margin,
                    y
                );


                y +=
                    lines.length *
                    5 +
                    3;


                if (
                    y >
                    270
                ) {

                    doc.addPage();

                    y = 20;
                }
            }
        );


        y += 5;
    }


    addListSection(
        "Observed Symptoms",
        report.symptoms
    );


    addListSection(
        "Suggested Actions",
        report.suggestions
    );


    if (
        y >
        265
    ) {

        doc.addPage();

        y = 20;
    }


    doc.setFontSize(9);

    doc.setFont(
        undefined,
        "italic"
    );


    doc.text(
        "AgriShield AI provides an AI-assisted indication, not a guaranteed diagnosis. Consult a qualified agriculture expert before treatment.",
        margin,
        y,
        {
            maxWidth: 170
        }
    );


    doc.save(
        (
            report.report_id ||
            "agrishield-report"
        ) +
        ".pdf"
    );
}
const downloadPdfBtn = document.getElementById("downloadPdfBtn");

if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener("click", function () {

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("AgriShield AI - Crop Health Report", 20, 20);

        doc.setFontSize(12);
        doc.text("Crop: " + resultCrop.textContent, 20, 40);
        doc.text("Risk Level: " + riskLevel.textContent, 20, 50);
        doc.text("Confidence: " + confidenceScore.textContent, 20, 60);
        doc.text("Disease: " + diseaseName.textContent, 20, 70);
        doc.text("Report ID: " + reportId.textContent, 20, 80);
        doc.text("Date: " + analysisTime.textContent, 20, 90);

        doc.save("AgriShield_Report.pdf");
    });
}
