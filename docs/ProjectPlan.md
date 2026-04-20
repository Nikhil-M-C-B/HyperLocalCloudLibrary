# Project Plan

Use this document to outline milestones, risks, and weekly goals.

## Team

- Name: Mohana Krishna
- Role: Backend Developer
- Name: Guntesh
- Role: Full Stack Developer
- Name: Khushi
- Role: Frontend Developer
- Name: Nikhil Mohan
- Role: Backend Architect
- Name: Aryan
- Role: Platform Architect

## Milestones

### After the requirements are finalized (after 2 weeks of meetings)

- Week 1 and 2:

  - Database and Data Modeling -Nikhil Mohan
  - System & Backend Architecture -Guntesh
  - UI/UX & User Flows - Khushi
  - AI & Recommendation Design - Mohana Krishna
  - Risk Analysis & Integration Plan - Aryan
- Week 3 and 4:

  - Mobile Client and UX Layer - Khushi
  - Mobile Application Logic Layer - Mohana Krishna
  - Backend Service Layer - Guntesh
  - Data & Storage Layer - Nikhil Mohan
  - Platform Services Layer - Aryan
- From Release-1 to Release - 2

  ***Khushi*** -

  **Guest-Friendly Home Page** : Access to book browsing without immediate login requirements.
  •  **Librarian Dashboard** : Interface to fetch book data via ISBN, edit details, and confirm uploads.
  •  **Discovery UI** : Author and Publisher dedicated pages with filtering capabilities.
  •  **Onboarding Flow** : 6-7 new personalization questionnaires for profile building.

  - Design Author’s page and Publisher’s page for the user
  - Design the Page before Login giving user a glimpse of books and UI
  - Add UML class diagram and description of classes in the diagram for the Design Doc
- ***Guntesh*** -

  - • **AI Quiz Engine**: Service to generate fresh questions for books every time via LLM.
    • **Book Data Ingestor**: Excel import service (ISBN/Title based) and ISBN fetcher. - **DONE**
    • **Review Aggregator**: Integration of reviews from Goodreads, Google, and Amazon.
    • **Smart Recommendation API**: Filters results to show only titles available in the specific library.
  - Add books from importing an excel sheet of book names/ ISBN numbers
  - Add / modify tags for the books which should be used in the chatbot
  - Add quizzes to the db for non-AI book quizzes
  - Add sequence diagrams required for the design document

* ***Nikhil Mohan Choudary***
* **Enhanced Database Schema** : Inclusion of "Shelf" and "Rack" attributes for physical inventory.
  • T**agging System** : Storage for generated tags used in book searching and chatbot queries.
  •  **Personalization Store** : Database structures for storing 6-7 questionnaire responses per user.
  •  **Unified Review Store** : Centralized storage for imported external reviews and comments.
* Observe the mobile UI and fix the bugs that make the user experience improve .
* Fix the location Edit and Delete options .
* Use some storage for the chatbot’s chat history and pressing on Owl in the nav bar should give you the chat history for the bot .
* You can make the maximum holdable conversations to 2 in testing phase.
* Add the answers to the profile questions in the array and add them into the profile Preferences so that user can edit them and add the vector embedding
* Add to cart option based on particular library.
* Update the database document after all the changes have been made in design document and the implementations to make them look consistent
* ***Mohana Krishna***
* **Library Context Manager** : Logic to browse multiple libraries and default to the "closest library".
  •  **Chatbot Guard** : Logic to restrict chatbot access to members or logged-in users only.
  •  **Subscription Workflow** : Handling the logic for user subscriptions and profile creation.
  •  **Quiz Handler** : Logic to fetch and display fresh AI-generated quizzes for physical and eBooks
* Make the plot_embeddiings in the mongoDB database for the vector-embeddings - **COMPLETED**
* Add the LLM workflow as getting info from the embedding mode(embedding LLM), vectorDB(server sends this embedding translation) ,MongoDB calculates the nearest available as nearest to the vector returned by the embedding translation,send the info finally to the conversation LLM(server sends this to the LLM )for the final conversation response to the user -**COMPLETED**
* Add the end of conversation after the user gives him more conversation info so that they don’t use too many credits and ask him to continue with the new chat.
* Deploy the backend onto a server using hosting platform  -COMPLETED
* Deployed on render and sent the app to the client
* Design Rationale ,
* Write the new testcases and Test Plan Updation
* Update the SRS and other living documents in the Docs
* ***Aaryan*** -
* **LLM Infrastructure** : Setup and scaling of the AI model for recommendations and quizzes.
* **Geolocation Service** : Service to identify and select the user's "closest library" by default.
* **CI/CD Pipeline** : Integration of codeRabbit to ensure high code quality during R1 updates.
* **Security/Auth Provider** : Managing secure login and subscription access gates
* Design and Implement the logic and data retrieval Author and Publisher pages some open source webpages

## Risks & Mitigations

- Risk:
- Mitigation:

## Notes
