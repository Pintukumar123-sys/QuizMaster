document.addEventListener("DOMContentLoaded", function () {
    // Elements for quiz page
    const quizTitle = document.getElementById("quiz-title");
    const questionElement = document.getElementById("question-text");
    const optionsContainer = document.getElementById("options");
    const nextButton = document.getElementById("next-btn");
    const prevButton = document.getElementById("prev-btn");
    const submitButton = document.getElementById("submit-btn");
    const progressBar = document.getElementById("progress-bar");

    // Elements for index page
    const categoryButtons = document.querySelectorAll(".category-btn");

    let quizData = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let selectedAnswers = {};
    let timerInterval;
    let timeLeft = 10; // 10 seconds per question

    // Clear any existing quiz results when on home page
    if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
        localStorage.removeItem("quizScore");
        localStorage.removeItem("totalQuestions");
        localStorage.removeItem("timeUp");
    }

    // Get category and difficulty from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get("category");
    const difficulty = urlParams.get("difficulty") || "medium";

    // If no category is selected, redirect to home page
    if (!category && window.location.pathname.includes('quiz.html')) {
        window.location.href = "index.html";
    }

    // Function to shuffle array (Fisher-Yates algorithm)
    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Timer functions
    function startTimer() {
        timeLeft = 10; // Reset to 10 seconds for each question
        updateTimerDisplay();

        const timerElement = document.getElementById("timer");
        const timerContainer = timerElement.parentElement;

        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();

            if (timeLeft <= 3) {
                timerContainer.classList.add("timer-warning");
            }

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                autoAdvanceQuestion();
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        const timerElement = document.getElementById("timer");
        timerElement.textContent = `${timeLeft.toString().padStart(2, '0')}s`;
    }

    function autoAdvanceQuestion() {
        saveSelectedAnswer();

        if (currentQuestionIndex < quizData.length - 1) {
            currentQuestionIndex++;
            loadQuestion();
            startTimer();
        } else {
            // Auto-submit if it's the last question
            autoSubmitQuiz();
        }
    }

    // Random Question Generator with Difficulty Levels
    function generateRandomQuestions(category, count = 10, difficulty = 'medium') {
        const questionBanks = {
            JavaScript: {
                easy: [
                    { question: "Which keyword is used to declare a constant variable in JavaScript?", options: ["var", "let", "const", "static"], correctAnswer: "const" },
                    { question: "What will be the output of typeof NaN in JavaScript?", options: ["Number", "Undefined", "Object", "Null"], correctAnswer: "Number" },
                    { question: "Which symbol is used for single-line comments in JavaScript?", options: ["//", "/* */", "#", "--"], correctAnswer: "//" },
                    { question: "Which operator is used to check both value and type equality in JavaScript?", options: ["==", "===", "!=", "<>"], correctAnswer: "===" },
                    { question: "How do you declare a function in JavaScript?", options: ["function myFunc() {}", "func myFunc() {}", "def myFunc() {}", "declare myFunc()"], correctAnswer: "function myFunc() {}" }
                ],
                medium: [
                    { question: "Which method is used to parse JSON data in JavaScript?", options: ["JSON.parse()", "JSON.stringify()", "JSON.toObject()", "JSON.decode()"], correctAnswer: "JSON.parse()" },
                    { question: "What does the this keyword refer to in JavaScript?", options: ["Current function", "Global object", "Current object", "Window object"], correctAnswer: "Current object" },
                    { question: "Which function is used to execute a function after a specified time in JavaScript?", options: ["setTimeout()", "setInterval()", "delay()", "wait()"], correctAnswer: "setTimeout()" },
                    { question: "Which array method is used to remove the last element of an array?", options: ["pop()", "push()", "shift()", "splice()"], correctAnswer: "pop()" },
                    { question: "Which method returns the character at a specified index in a string?", options: ["charAt()", "getChar()", "charAtIndex()", "substring()"], correctAnswer: "charAt()" }
                ],
                hard: [
                    { question: "What is the result of [] + [] in JavaScript?", options: ["[]", '""', "undefined", "TypeError"], correctAnswer: '""' },
                    { question: "What does Object.prototype.toString.call(null) return?", options: ["[object Null]", "[object Object]", "[object null]", "null"], correctAnswer: "[object Null]" },
                    { question: "Which of these is NOT a falsy value in JavaScript?", options: ["0", '""', "null", "[]"], correctAnswer: "[]" },
                    { question: "What is the output of 3 > 2 > 1 in JavaScript?", options: ["true", "false", "TypeError", "undefined"], correctAnswer: "false" },
                    { question: "Which method creates a new array with all sub-array elements concatenated?", options: ["flat()", "flatten()", "concat()", "merge()"], correctAnswer: "flat()" }
                ]
            },
            Python: {
                easy: [
                    { question: "Which keyword is used to create a function in Python?", options: ["func", "function", "def", "define"], correctAnswer: "def" },
                    { question: "How do you create a list in Python?", options: ["list = ()", "list = {}", "list = []", "list = <>"], correctAnswer: "list = []" },
                    { question: "What is the correct file extension for Python files?", options: [".txt", ".py", ".python", ".p"], correctAnswer: ".py" },
                    { question: "How do you start a comment in Python?", options: ["//", "/*", "#", "<!--"], correctAnswer: "#" },
                    { question: "How do you access the first element of a list in Python?", options: ["list[1]", "list(0)", "list[0]", "first(list)"], correctAnswer: "list[0]" }
                ],
                medium: [
                    { question: "Which of the following is a mutable data type in Python?", options: ["String", "Tuple", "List", "Integer"], correctAnswer: "List" },
                    { question: "What does len() function do in Python?", options: ["Returns type", "Returns length", "Converts to list", "Returns value"], correctAnswer: "Returns length" },
                    { question: "Which keyword is used to handle exceptions in Python?", options: ["catch", "try", "handle", "exception"], correctAnswer: "try" },
                    { question: "What is the output of 2**3 in Python?", options: ["6", "8", "5", "23"], correctAnswer: "8" },
                    { question: "How do you install a package in Python?", options: ["pip install", "install pip", "python get", "import add"], correctAnswer: "pip install" }
                ],
                hard: [
                    { question: "What is the output of print(type(lambda: None))?", options: ["<class 'function'>", "<class 'lambda'>", "<class 'type'>", "<class 'object'>"], correctAnswer: "<class 'function'>" },
                    { question: "Which decorator is used to create a class method?", options: ["@staticmethod", "@classmethod", "@property", "@method"], correctAnswer: "@classmethod" },
                    { question: "What does **kwargs represent in function parameters?", options: ["Positional args", "Keyword args", "Variable args", "Default args"], correctAnswer: "Keyword args" },
                    { question: "Which method is called when an object is created?", options: ["__init__", "__new__", "__create__", "__start__"], correctAnswer: "__new__" },
                    { question: "What is the purpose of super() in Python?", options: ["Call parent method", "Create instance", "Access class", "Import module"], correctAnswer: "Call parent method" }
                ]
            },
            HTML: {
                easy: [
                    { question: "Which tag is used to define a heading in HTML?", options: ["<head>", "<h1>", "<header>", "<heading>"], correctAnswer: "<h1>" },
                    { question: "What is the correct HTML element for inserting a line break?", options: ["<br>", "<break>", "<lb>", "<newline>"], correctAnswer: "<br>" },
                    { question: "Which attribute specifies an alternate text for an image?", options: ["title", "alt", "src", "href"], correctAnswer: "alt" },
                    { question: "How do you create a hyperlink in HTML?", options: ["<link>", "<a>", "<href>", "<url>"], correctAnswer: "<a>" },
                    { question: "Which tag is used to create an ordered list?", options: ["<ul>", "<list>", "<ol>", "<dl>"], correctAnswer: "<ol>" }
                ],
                medium: [
                    { question: "What does HTML stand for?", options: ["Hypertext Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlinks and Text Markup Language"], correctAnswer: "Hypertext Markup Language" },
                    { question: "Which tag defines the structure of an HTML document?", options: ["<html>", "<body>", "<head>", "<structure>"], correctAnswer: "<html>" },
                    { question: "How do you add a comment in HTML?", options: ["// comment", "/* comment */", "<!-- comment -->", "# comment"], correctAnswer: "<!-- comment -->" },
                    { question: "Which attribute is used to specify the URL of a link?", options: ["url", "link", "href", "src"], correctAnswer: "href" },
                    { question: "What is the correct way to create a table in HTML?", options: ["<table>", "<tbl>", "<tab>", "<spreadsheet>"], correctAnswer: "<table>" }
                ],
                hard: [
                    { question: "Which attribute specifies that an input field must be filled out?", options: ["required", "mandatory", "validate", "must"], correctAnswer: "required" },
                    { question: "What is the purpose of the <meta> tag?", options: ["Style content", "Script content", "Metadata", "Navigation"], correctAnswer: "Metadata" },
                    { question: "Which HTML5 element is used for playing video files?", options: ["<video>", "<media>", "<movie>", "<play>"], correctAnswer: "<video>" },
                    { question: "What does the defer attribute do in script tags?", options: ["Execute immediately", "Execute after load", "Execute before load", "Never execute"], correctAnswer: "Execute after load" },
                    { question: "Which element is used to group form controls?", options: ["<group>", "<fieldset>", "<formgroup>", "<control>"], correctAnswer: "<fieldset>" }
                ]
            },
            CSS: {
                easy: [
                    { question: "How do you add a background color to an element?", options: ["bgcolor", "background-color", "bg-color", "color-background"], correctAnswer: "background-color" },
                    { question: "How do you make text bold in CSS?", options: ["font-weight: bold", "font: bold", "text-bold: true", "bold: text"], correctAnswer: "font-weight: bold" },
                    { question: "Which CSS property is used to change the font size?", options: ["font-size", "text-size", "size", "font-weight"], correctAnswer: "font-size" },
                    { question: "How do you center align text in CSS?", options: ["text-align: center", "align: center", "center-text", "text-center"], correctAnswer: "text-align: center" },
                    { question: "Which CSS property is used for spacing around elements?", options: ["spacing", "padding", "margin", "distance"], correctAnswer: "margin" }
                ],
                medium: [
                    { question: "How do you select an element with a specific ID in CSS?", options: [".id", "#id", "@id", "&id"], correctAnswer: "#id" },
                    { question: "How do you select elements with a specific class in CSS?", options: ["#class", ".class", "@class", "&class"], correctAnswer: ".class" },
                    { question: "Which property is used to change the text color?", options: ["text-color", "color", "font-color", "foreground"], correctAnswer: "color" },
                    { question: "How do you add space inside an element's border?", options: ["margin", "padding", "spacing", "distance"], correctAnswer: "padding" },
                    { question: "Which CSS property controls text decoration?", options: ["text-decoration", "text-style", "decoration", "text-format"], correctAnswer: "text-decoration" }
                ],
                hard: [
                    { question: "What does box-sizing: border-box do?", options: ["Includes padding in width", "Excludes padding from width", "Adds border to box", "Removes border from box"], correctAnswer: "Includes padding in width" },
                    { question: "Which CSS property creates a flex container?", options: ["display: flex", "display: block", "display: inline", "display: grid"], correctAnswer: "display: flex" },
                    { question: "What is the default position value?", options: ["static", "relative", "absolute", "fixed"], correctAnswer: "static" },
                    { question: "Which pseudo-class targets the first child?", options: [":first", ":first-child", ":child-first", ":initial"], correctAnswer: ":first-child" },
                    { question: "What does z-index control?", options: ["Horizontal position", "Vertical position", "Stacking order", "Size order"], correctAnswer: "Stacking order" }
                ]
            },
            Java: {
                easy: [
                    { question: "Which keyword is used to create a class in Java?", options: ["class", "def", "struct", "interface"], correctAnswer: "class" },
                    { question: "What is the entry point of a Java program?", options: ["start()", "begin()", "main()", "run()"], correctAnswer: "main()" },
                    { question: "Which of these is a primitive data type in Java?", options: ["String", "int", "ArrayList", "HashMap"], correctAnswer: "int" },
                    { question: "How do you declare an array in Java?", options: ["int array[10]", "int[] array", "array int[]", "int array = new int[10]"], correctAnswer: "int[] array" },
                    { question: "What does 'new' keyword do in Java?", options: ["Creates variable", "Allocates memory", "Declares variable", "Initializes value"], correctAnswer: "Allocates memory" }
                ],
                medium: [
                    { question: "Which access modifier is most restrictive in Java?", options: ["public", "private", "protected", "default"], correctAnswer: "private" },
                    { question: "What is the purpose of the 'final' keyword in Java?", options: ["To start", "To prevent modification", "To declare variable", "To create class"], correctAnswer: "To prevent modification" },
                    { question: "How do you handle exceptions in Java?", options: ["try-catch", "if-else", "try-finally", "catch-finally"], correctAnswer: "try-catch" },
                    { question: "What is the output of 5/2 in Java?", options: ["2.5", "2", "2.0", "Error"], correctAnswer: "2" },
                    { question: "Which method is used to find the length of a string in Java?", options: ["size()", "length()", "count()", "len()"], correctAnswer: "length()" }
                ],
                hard: [
                    { question: "Which interface is the root of the collection hierarchy?", options: ["List", "Set", "Collection", "Map"], correctAnswer: "Collection" },
                    { question: "What is the default value of a boolean in Java?", options: ["true", "false", "null", "0"], correctAnswer: "false" },
                    { question: "Which keyword is used for method overriding?", options: ["override", "@Override", "extends", "implements"], correctAnswer: "@Override" },
                    { question: "What does JVM stand for?", options: ["Java Virtual Machine", "Java Variable Memory", "Java Virtual Method", "Java Value Manager"], correctAnswer: "Java Virtual Machine" },
                    { question: "Which exception is thrown when dividing by zero?", options: ["NullPointerException", "ArithmeticException", "IOException", "ClassCastException"], correctAnswer: "ArithmeticException" }
                ]
            },
            "Cpp": {
                easy: [
                    { question: "Which header file is used for input/output in C++?", options: ["<cstdio>", "<iostream>", "<io.h>", "<stdio.h>"], correctAnswer: "<iostream>" },
                    { question: "Which keyword is used to define a constant in C++?", options: ["const", "static", "final", "immutable"], correctAnswer: "const" },
                    { question: "What does 'std::' mean in C++?", options: ["Standard library", "String dynamic", "System define", "Static definition"], correctAnswer: "Standard library" },
                    { question: "How do you create a pointer in C++?", options: ["int &ptr", "int *ptr", "int ptr*", "int ptrRef"], correctAnswer: "int *ptr" },
                    { question: "What is the default return type of main() in C++?", options: ["void", "int", "bool", "char"], correctAnswer: "int" }
                ],
                medium: [
                    { question: "Which operator is used to access members of a class through a pointer?", options: [".", "->", "::", "*"], correctAnswer: "->" },
                    { question: "How do you declare a function in C++?", options: ["function name() {}", "def name() {}", "name() {}", "void name() {}"], correctAnswer: "void name() {}" },
                    { question: "Which STL container provides random access?", options: ["list", "deque", "vector", "queue"], correctAnswer: "vector" },
                    { question: "What is the size of 'int' in C++?", options: ["1 byte", "2 bytes", "4 bytes", "It depends"], correctAnswer: "It depends" },
                    { question: "How do you allocate dynamic memory in C++?", options: ["malloc", "alloc", "new", "create"], correctAnswer: "new" }
                ],
                hard: [
                    { question: "What is the purpose of 'virtual' keyword in C++?", options: ["Create object", "Enable polymorphism", "Define constant", "Access member"], correctAnswer: "Enable polymorphism" },
                    { question: "Which operator is used for dynamic casting?", options: ["static_cast", "dynamic_cast", "const_cast", "reinterpret_cast"], correctAnswer: "dynamic_cast" },
                    { question: "What does RAII stand for?", options: ["Resource Acquisition Is Initialization", "Random Access Input Interface", "Recursive Algorithm Implementation", "Recursive Algorithm Implementation"], correctAnswer: "Resource Acquisition Is Initialization" },
                    { question: "Which smart pointer automatically deletes the object?", options: ["unique_ptr", "shared_ptr", "weak_ptr", "auto_ptr"], correctAnswer: "unique_ptr" },
                    { question: "What is the result of 'sizeof(char)' in C++?", options: ["1", "2", "4", "Depends on compiler"], correctAnswer: "1" }
                ]
            },
            SQL: {
                easy: [
                    { question: "Which statement is used to retrieve data from a database?", options: ["GET", "SELECT", "FETCH", "RETRIEVE"], correctAnswer: "SELECT" },
                    { question: "What does SQL stand for?", options: ["Simple Query Language", "Structured Query Language", "Standard Query Language", "Strong Query Language"], correctAnswer: "Structured Query Language" },
                    { question: "Which keyword is used to filter records?", options: ["FILTER", "WHERE", "IF", "CHECK"], correctAnswer: "WHERE" },
                    { question: "How do you sort records in SQL?", options: ["SORT BY", "ORDER BY", "ARRANGE BY", "SORT"], correctAnswer: "ORDER BY" },
                    { question: "Which keyword is used to avoid duplicate results?", options: ["NO DUPLICATE", "UNIQUE", "DISTINCT", "DIFFERENT"], correctAnswer: "DISTINCT" }
                ],
                medium: [
                    { question: "What is a primary key in SQL?", options: ["Key for access", "Unique identifier", "Security key", "Required field"], correctAnswer: "Unique identifier" },
                    { question: "Which function counts the number of rows?", options: ["SUM()", "COUNT()", "TOTAL()", "ROWS()"], correctAnswer: "COUNT()" },
                    { question: "How do you insert data into a table?", options: ["ADD", "INSERT INTO", "PUT", "APPEND"], correctAnswer: "INSERT INTO" },
                    { question: "Which keyword is used to update records?", options: ["CHANGE", "MODIFY", "UPDATE", "SET"], correctAnswer: "UPDATE" },
                    { question: "How do you delete records from a table?", options: ["REMOVE", "ERASE", "DELETE FROM", "DROP"], correctAnswer: "DELETE FROM" }
                ],
                hard: [
                    { question: "Which clause is used to combine rows from two or more tables?", options: ["UNION", "JOIN", "MERGE", "COMBINE"], correctAnswer: "JOIN" },
                    { question: "What does ACID stand for in database transactions?", options: ["Atomicity, Consistency, Isolation, Durability", "Access, Control, Integrity, Data", "Automatic, Consistent, Independent, Durable", "All, Complete, Isolated, Done"], correctAnswer: "Atomicity, Consistency, Isolation, Durability" },
                    { question: "Which type of join returns all records from left table?", options: ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN"], correctAnswer: "LEFT JOIN" },
                    { question: "What is a foreign key?", options: ["Primary key of another table", "Unique identifier", "Index key", "Security key"], correctAnswer: "Primary key of another table" },
                    { question: "Which statement creates an index on a table?", options: ["CREATE INDEX", "ADD INDEX", "MAKE INDEX", "SET INDEX"], correctAnswer: "CREATE INDEX" }
                ]
            }
        };

        const categoryQuestions = questionBanks[category]?.[difficulty] || questionBanks["JavaScript"]?.[difficulty] || questionBanks["JavaScript"]["medium"];
        const shuffled = shuffleArray(categoryQuestions);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }

    // Handle difficulty button clicks on index.html
    let selectedDifficulty = "medium"; // Default difficulty
    const difficultyButtons = document.querySelectorAll(".difficulty-btn");

    if (difficultyButtons.length > 0) {
        difficultyButtons.forEach(button => {
            button.addEventListener("click", function () {
                // Remove active class from all difficulty buttons
                difficultyButtons.forEach(btn => btn.classList.remove("active"));
                // Add active class to clicked button
                this.classList.add("active");
                selectedDifficulty = this.getAttribute("data-difficulty");
            });
        });

        // Set medium as default active
        const mediumBtn = document.querySelector('.difficulty-btn[data-difficulty="medium"]');
        if (mediumBtn) {
            mediumBtn.classList.add("active");
        }
    }

    // Handle category button clicks on index.html
    if (categoryButtons.length > 0) {
        categoryButtons.forEach(button => {
            button.addEventListener("click", function () {
                const selectedCategory = this.getAttribute("data-category");
                window.location.href = `quiz.html?category=${selectedCategory}&difficulty=${selectedDifficulty}`;
            });
        });
    }

    // Search functionality for index page
    const searchForm = document.querySelector("form[role='search']");
    const searchInput = document.querySelector("input[type='search']");
    const quizCards = document.querySelectorAll(".quiz-card");

    if (searchForm && searchInput && quizCards.length > 0) {
        // Check for search parameter in URL
        const urlParams = new URLSearchParams(window.location.search);
        const searchParam = urlParams.get('search');
        if (searchParam) {
            searchInput.value = searchParam;
        }

        // Prevent form submission and handle search
        searchForm.addEventListener("submit", function(e) {
            e.preventDefault();
            performSearch();
        });

        // Live search as user types
        searchInput.addEventListener("input", function() {
            performSearch();
        });

        // Perform initial search if there's a search parameter
        if (searchParam) {
            performSearch();
        }

        function performSearch() {
            const searchTerm = searchInput.value.toLowerCase().trim();
            let visibleCount = 0;

            // Define broad search terms that should show all programming language quizzes
            const broadTerms = [
                'programming', 'language', 'languages', 'coding', 'code', 'developer',
                'development', 'scripting', 'web', 'software', 'computer', 'tech',
                'technology', 'learn', 'tutorial', 'course', 'quiz', 'test', 'exam'
            ];

            const isBroadSearch = broadTerms.some(term => searchTerm.includes(term)) ||
                                searchTerm.length <= 2; // Very short searches show all

            quizCards.forEach(card => {
                const title = card.querySelector(".card-title").textContent.toLowerCase();
                const description = card.querySelector(".card-text").textContent.toLowerCase();
                const category = card.querySelector("a").href.split('category=')[1]?.toLowerCase() || '';

                // Check for exact matches or broad search terms
                const exactMatch = title.includes(searchTerm) ||
                                 description.includes(searchTerm) ||
                                 category.includes(searchTerm);

                // Check for partial matches (e.g., "java" should match "javascript")
                const partialMatch = searchTerm.length >= 3 &&
                                   (title.includes(searchTerm) ||
                                    description.includes(searchTerm) ||
                                    category.includes(searchTerm) ||
                                    searchTerm.includes(category) ||
                                    category.includes(searchTerm));

                // Check for language synonyms
                const languageSynonyms = {
                    'js': ['javascript', 'js', 'ecmascript'],
                    'javascript': ['javascript', 'js', 'ecmascript'],
                    'py': ['python', 'py'],
                    'python': ['python', 'py'],
                    'html': ['html', 'markup', 'web'],
                    'css': ['css', 'stylesheet', 'style'],
                    'c++': ['c++', 'cpp', 'c plus plus'],
                    'cpp': ['c++', 'cpp', 'c plus plus'],
                    'java': ['java', 'java programming'],
                    'sql': ['sql', 'database', 'query']
                };

                let synonymMatch = false;
                for (const [key, synonyms] of Object.entries(languageSynonyms)) {
                    if (synonyms.includes(searchTerm) || searchTerm.includes(key)) {
                        if (category === key || synonyms.some(syn => category.includes(syn))) {
                            synonymMatch = true;
                            break;
                        }
                    }
                }

                const matches = exactMatch || partialMatch || synonymMatch || isBroadSearch || searchTerm === '';

                if (matches) {
                    card.style.display = 'block';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });

            // Show/hide "no results" message
            showNoResultsMessage(visibleCount === 0 && searchTerm !== '');
        }

        function showNoResultsMessage(show) {
            let noResultsMsg = document.getElementById('no-results-message');

            if (show && !noResultsMsg) {
                // Create no results message
                noResultsMsg = document.createElement('div');
                noResultsMsg.id = 'no-results-message';
                noResultsMsg.className = 'alert alert-info text-center mt-4';
                noResultsMsg.innerHTML = `
                    <h4>🔍 No quizzes found</h4>
                    <p>Try searching for programming languages:</p>
                    <div class="d-flex flex-wrap justify-content-center gap-2 mt-3">
                        <button class="btn btn-outline-primary btn-sm search-suggestion" data-term="javascript">JavaScript</button>
                        <button class="btn btn-outline-primary btn-sm search-suggestion" data-term="python">Python</button>
                        <button class="btn btn-outline-primary btn-sm search-suggestion" data-term="html">HTML</button>
                        <button class="btn btn-outline-primary btn-sm search-suggestion" data-term="css">CSS</button>
                        <button class="btn btn-outline-primary btn-sm search-suggestion" data-term="programming">Programming</button>
                        <button class="btn btn-outline-primary btn-sm search-suggestion" data-term="web">Web Development</button>
                    </div>
                    <button class="btn btn-primary mt-3" onclick="clearSearch()">Clear Search</button>
                `;

                const quizListSection = document.querySelector('.quiz-list .container');
                quizListSection.appendChild(noResultsMsg);

                // Add event listeners to suggestion buttons
                document.querySelectorAll('.search-suggestion').forEach(btn => {
                    btn.addEventListener('click', function() {
                        searchInput.value = this.getAttribute('data-term');
                        performSearch();
                    });
                });
            } else if (!show && noResultsMsg) {
                noResultsMsg.remove();
            }
        }

        // Function to clear search (will be available globally)
        window.clearSearch = function() {
            searchInput.value = '';
            performSearch();
        };
    }

    // Load quiz data if on quiz.html
    if (quizTitle && questionElement && optionsContainer) {
        // Generate random questions
        quizData = generateRandomQuestions(category, 10, difficulty);
        
        if (quizData && quizData.length > 0) {
            quizTitle.textContent = `${category} Quiz`;
            loadQuestion();
            startTimer();
        } else {
            questionElement.textContent = "No questions available for this category.";
            optionsContainer.innerHTML = "";
            nextButton.style.display = "none";
            prevButton.style.display = "none";
            submitButton.style.display = "none";
            progressBar.style.width = "0%";
            progressBar.textContent = "0%";
        }
    }

    // Load question into the DOM
    function loadQuestion() {
        if (currentQuestionIndex < 0 || currentQuestionIndex >= quizData.length) return;

        const currentQuestion = quizData[currentQuestionIndex];
        questionElement.textContent = `${currentQuestionIndex + 1}. ${currentQuestion.question}`;
        optionsContainer.innerHTML = "";

        currentQuestion.options.forEach((option, index) => {
            const optionElement = document.createElement("div");
            optionElement.classList.add("form-check", "mb-2");
            optionElement.innerHTML = `
                <input class="form-check-input" type="radio" name="option" id="option${index}" value="${option}" ${selectedAnswers[currentQuestionIndex] === option ? "checked" : ""}>
                <label class="form-check-label" for="option${index}">${option}</label>
            `;

            optionsContainer.appendChild(optionElement);
        });

        // Reset timer warning for new question
        const timerContainer = document.getElementById("timer").parentElement;
        timerContainer.classList.remove("timer-warning");

        updateNavigationButtons();
        updateProgressBar();
    }

    // Update navigation button visibility
    function updateNavigationButtons() {
        prevButton.style.display = currentQuestionIndex > 0 ? "inline-block" : "none";
        nextButton.style.display = currentQuestionIndex < quizData.length - 1 ? "inline-block" : "none";
        submitButton.style.display = currentQuestionIndex === quizData.length - 1 ? "block" : "none";
    }

    // Update progress bar
    function updateProgressBar() {
        const progress = ((currentQuestionIndex + 1) / quizData.length) * 100;
        progressBar.style.width = `${progress}%`;
        progressBar.textContent = `${Math.round(progress)}%`;
        progressBar.setAttribute("aria-valuenow", progress);
    }

    // Save selected answer
    function saveSelectedAnswer() {
        const selectedOption = document.querySelector("input[name='option']:checked");
        if (selectedOption) {
            selectedAnswers[currentQuestionIndex] = selectedOption.value;
        }
    }

    // Event Listeners
    if (nextButton) {
        nextButton.addEventListener("click", function () {
            clearInterval(timerInterval);
            saveSelectedAnswer();
            if (currentQuestionIndex < quizData.length - 1) {
                currentQuestionIndex++;
                loadQuestion();
                startTimer();
            }
        });
    }

    if (prevButton) {
        prevButton.addEventListener("click", function () {
            clearInterval(timerInterval);
            saveSelectedAnswer();
            if (currentQuestionIndex > 0) {
                currentQuestionIndex--;
                loadQuestion();
                startTimer();
            }
        });
    }

    if (submitButton) {
        submitButton.addEventListener("click", function () {
            clearInterval(timerInterval);
            saveSelectedAnswer();
            submitQuiz();
        });
    }

    // Function to submit quiz (called by both submit button and auto-submit)
    function submitQuiz() {
        score = 0;
        quizData.forEach((question, index) => {
            if (selectedAnswers[index] === question.correctAnswer) {
                score++;
            }
        });

        console.log("Quiz Score:", score, "Total Questions:", quizData.length);
        localStorage.setItem("quizScore", score);
        localStorage.setItem("totalQuestions", quizData.length);

        console.log("Data saved to localStorage. Redirecting to result.html...");
        window.location.href = "result.html";
    }

    // Function to auto-submit when timer runs out on last question
    function autoSubmitQuiz() {
        localStorage.setItem("timeUp", "true");
        submitQuiz();
    }
});