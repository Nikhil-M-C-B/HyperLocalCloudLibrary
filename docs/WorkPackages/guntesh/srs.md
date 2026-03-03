Software Requirements Specification Document
Brief Problem Statement:
In this rapid ever-changing and fast technology advancement driven world kids
always get caught in between tensions and often get forgotten by users.Hence they are not
exposed to books and the concept of library which takes away their mental growth. So for
their proper mental nurturing and developing a healthy mind away from social media and far
from distractions, we have brought their books to their home by using the
“Hyper Local Cloud Library ” app.

System Requirements:
A mobile-first platform dedicated for kids where the users check-out the books in the
library around their surroundings (8-10km radius) from the comfort of their homes and to
order them for themselves or for their kids at their doorstep to make sure that they are
developing mentally in this new-age GenZ world.
For the task of maintaining a library of books,handling payments and giving kids a
neat,clean and non-addictive user interface we use the following architecture:
● Backend : Nodejs for backend development , MongoDB to store books for their
faster retrieval, MySQL for managing the transaction database which should not be
modified easily ,Python for rapid API framework.
● Frontend : ReactNative which makes it easier for both Android and iOS development
● AI Chatbot : LLM (to be decided)+MCP servers
● Infrastructure : Depends on how the client wants to deploy

User’s Profile:
The system is used by both users, their children and the library manager along with
an admin who has multiple library branches across the city.

Users : They are the ones who are the main target audience for the app.
Kids : They are the ones who use our app primarily to browse through the books and
select the books which they like.
Librarian : The one who manages the library.These people add the new books which
are in the library currently and take care of issuing and accepting return from the
users
Admin :Owner of branches of libraries spread around the city .He oversees the
performance of the branches of libraries.
Feature requirements:
No. Use Case Description Release
Create the account Users registers with required information and sets
up the children profiles
R
Login User logs into existing account R
Create Profile User creates a new profile R
Edit Profile User edits an existing profile R
Select Profile User selects a profile after login/app start R
Switch Profile User switches to another profile from an existing
profile
R
Delete profile User deletes an existing profile. R
Browse Books All the users must be able to browse the available
books by title/author.
R
Check book availability Users should be able to check the availability of
the book in the libraries around their vicinity
R
Order Books Users should be able to order the desired book
from the nearest library they choose
R
Pay for the books Users should be able to pay for the books which
are ordered through online payment only
R
Track ordered books Users should be able to see the status of their
order and the book must be delivered within 3
working days
(SHIPPED/OUT FOR DELIVERY/DELIVERED)
R
Chat with chatbot Users and Children must be able to chat with the
AI chatbot and get their recommended book
R
Read Book Summary Users and children should be able to read the
summary of books which can be between 10-
lines for the plot
R
Review and comments Users should be able to see reviews and
comments from both children and users to
understand the book better
R
Return the book Users should be able to return the book to the
library in working hours of delivery.
R
Apply fines Users must face a fine if the return date is past
their due date automatically and notify them
R
Monitor account Users must see what the child profile has done R
and read until now and check his screen time
Add Books Librarian must be able to add the books that are
in library
R
Issue history Librarian must be able to see issued history
details of book
R
8 Admin Dashboard The owner of the Libraries must be able to see
the analytics of the books and libraries that are
active in the application.
R
Quizzes after reading Kids can have an option to check their knowledge
after reading the book which they ordered.
R
Create new Librarian Admin can add a new library branch by
registering using required details.
R
Use case diagram:
Use Case descriptions:
Use Case No. UC-
Use Case Name Create a User account
Overview Users can create a new account after downloading the app.
Actors User
Pre-condition User downloads the app and opens the app
Flow Main Flow:
Users open the app.
Users provide the required details for creating an account
using his contact information along with password (strong).
Users enter the received OTP.
User selects the interested genres of his pick.
Alternate Flow:
4a.User enters the wrong OTP and is redirected to contact
. information screen
Post Condition Users enter the Users dashboard
Use Case No. UC-
Use Case Name Login to existing account
Overview Users login to their account which was already created previously.
Actors User
Pre-condition User clicks the login screen after downloading or has been logged out
of the app previously.
Flow Main Flow:
User enters his email / Mobile no. and password
User enters his dashboard.
Alternate Flow:
2a.User enters the wrong password and tries again
1a.User clicks on Forgot Password ,enters the received OTP and.
resets his password after completion redirected to login screen
Post Condition Users enter the Profile Selection page.
Use Case No. UC-
Use Case Name Create new profile
Overview User creates a new profile.
Actors User
Pre-condition User is logged in and on the profile selection page
Flow Main Flow:

User selects an option to create a new profile displayed on the
screen.
User enters required details.
User saves the details.
Alternate Flow:
3a. Data Validation Error: If a user tries to save the profile with
missing required fields (e.g., name, age) or invalid data, the system
shows an error message next to the affected field(s), user goes back
to 2.
3b. Profile creation halted. User cancels the action and is redirected
to the profile manager page
Post Condition User is redirected back to the profile selection page to select a profile
or create another profile.
Use Case No. UC-
Use Case Name Edit Profile
Overview User modifies the details of an existing profile (either parent or child).
Actors User
Pre-condition User is logged in and on the profile management or selection page.
Flow Main Flow:
User selects a profile and clicks the 'Edit' option.
System loads the current profile details into an editable form.
User modifies required details (e.g., name, age, preferred genres).
User saves the changes.
Alternate Flow:
4a. Data Validation Error: If a user tries to save the profile with invalid
data, the system shows an error message and user goes back to 3.
Post Condition Profile details are updated in the system, and the user is redirected to
the profile selection page.
Use Case No. UC-
Use Case Name Select an existing profile.
Overview User selects an existing profile on the profile selection page.
Actors User
Pre-condition User is logged in and redirected to the profile selection page.
Flow Main Flow:

User clicks on an existing profile displayed on the profile
selection page..
Alternate Flow:
1a. Profile Loading Error: If the selected profile cannot be loaded
due to data corruption or a temporary system error, the system
displays an error message ("Unable to load profile. Please try again.")
and keeps the user on the Profile Selection page
Post Condition Users enter the Users dashboard
Use Case No. UC-
Use Case Name Switch profiles.
Overview User switches from an existing profile to another profile.
Actors User
Pre-condition User is logged in and has already selected a profile.
Flow Main Flow:
User clicks on the profile icon displayed on the user
dashboard, which redirects him to the profile selection page.
User can either now create a profile or select another profile
Alternate Flow:
2a. Profile Loading Error: If the selected profile cannot be loaded
due to data corruption or a temporary system error, the system
displays an error message ("Unable to load profile. Please try again.")
and keeps the user on the Profile Selection page.
Post Condition Users enter the Users dashboard
Use Case No. UC-
Use Case Name Delete profile
Overview User deletes an existing profile.
Actors User
Pre-condition User is logged in, on the profile selection page, and has at least one
profile other than the one being deleted (if deleting the last child
profile) or is deleting the primary/parent profile.
Flow Main Flow:

User navigates to the profile management section.
User selects a profile and clicks 'Delete'.
System displays a confirmation prompt (e.g., "Are you sure you
want to delete [Profile Name]? All associated reading history will be
lost.").
User confirms the deletion.
System permanently removes the profile and its associated data
(reading history, quizzes).
Alternate Flow:
4a. User cancels the action.
Post Condition The profile is removed from the system, and the User is redirected to
the Profile Selection page.
Use Case No. UC-
Use Case Name Browse through the catalog of books
Overview Users can search through the catalog of books either through
title/author or by using filter
Actors User / Kids => (User in this use-case)
Pre-condition User opens his dashboard and clicks on the search bar.
Flow Main Flow:
User enters the name of the book/author.
User sees the book name he wants to search and clicks on it.
Alternate Flow:
2a.User doesn’t find the desired book and is redirected to no
results screen.
2b.User wants the advanced search using filters to find it.
Post Condition User is redirected to the Detailed Book View screen.
Use Case No. UC-
Use Case Name Check the availability of the books
Overview Users can check the availability of a particular book.
Actors Users
Pre-condition User clicks on the Detailed Book View.
Flow Main Flow:

Users see the availability of the book in their nearby libraries.
Post Condition Users can order the book after checking availability if it is available.
Use Case No.: UC-
Use Case Name Order Books
Overview: Users order a desired book from a local library for home delivery.
Actors: User, External Payment Gateway (Razorpay)
Pre condition: The User must be logged in, have a valid delivery address, and the
selected book must be marked as "Available".
Flow: Main Flow:
User adds an available book to their cart.
User confirms the delivery address.
System redirects to the payment gateway.
User completes the fixed borrowing period payment.
System confirms payment and updates book status to
"Ordered"
The system generates an order ID and notifies the Librarian.
Alternate Flows:
3a. Payment fails: System alerts the user and keeps the book in the
cart. (Post condition: Book remains "Available").
Post Condition: The book is reserved, payment is recorded, and the order is sent to
the library queue.
Use Case No: UC-
Use Case Name: Pay^ for^ Books^
Overview: Users complete the online transaction for the fixed borrowing period
and the delivery fee.
Actors: User, Payment System (Razorpay)
Pre-condition: User is logged in, has a valid delivery address, and has selected a
book marked as "Available" and clicked on place order.
Flow: Main Flow:

User navigates to the checkout screen.
System calculates the borrowing fee and displays the total.
User clicks "Proceed to Pay".
System redirects the User to the Razorpay API payment gateway.
User completes the transaction.
Razorpay sends a success token to the NodeJS backend.
System updates the book status to PAID and assigns it to the
delivery queue.
Alternate Flow:
5a. Payment fails or is cancelled: System alerts the User and keeps
the book in the cart. Book remains "Available".
Post Condition: The transaction is recorded in the SQL database, and the book is
prepped for shipping.
Use Case No: UC-
Use Case Name: Track ordered books
Overview: Users track the status of their order to ensure delivery within 3
working days.
Actors: User, Delivery System (e.g., Delhivery)
Pre condition: An order has been successfully placed and payment is verified.
Flow: Main Flow:

User navigates to 'My Orders'.
System fetches order status via the delivery partner's API.
System displays status as SHIPPED, OUT FOR DELIVERY, or
DELIVERED.
Alternate Flows:
2a. Delivery API is down: System displays the last known status with
a timestamp.
Post Condition: Users view the real-time physical status of their book order.
Use Case No: UC-
Use Case Name: Chat with chatbot
Overview: Users and Children interact with the AI chatbot to receive
personalized book recommendations.
Actors: User, Child, AI System (LLM + MCP Servers)
Pre condition: User is logged in and the LLM service is active.
Flow: Main Flow:

User opens the chat interface and sends a query.
System routes the query to the AI engine.
AI retrieves context and generates a recommendation.
System displays the AI's response and book links.
Alternate Flows:
3a. AI fails to respond: System displays a generic fallback suggestion.
Post Condition: User receives relevant book suggestions.
Use Case No: UC-
Use Case Name: Read Book Summary
Overview: Users read a concise 10-15 line summary of the book's plot before
ordering.
Actors: User, Child
Pre condition: User is on the Book Details screen.
Flow: Main Flow:

User clicks on a specific book.
System retrieves the book's metadata from MongoDB.
System displays the 10-15 line plot summary.
Alternate Flows:
2a. Summary is missing: System displays "Summary currently
unavailable".
Post Condition: User has enough context to decide whether to order the book.
Use Case No: UC-
Use Case Name: Review and comments
Overview: Users view community reviews and comments to better understand
the book's value.
Actors: User, Child
Pre condition: User is viewing a Book Details screen.
Flow: Main Flow:

User scrolls to the 'Reviews' section.
System fetches approved reviews from the database.
User reads comments left by other users and children.
Alternate Flows:
2a. No reviews exist: System prompts user to "Be the first to review!".
Post Condition: User successfully views peer feedback on the book.
Use Case No: UC-
Use Case Name: Return the book
Overview: Users initiate the return of a book during standard working hours.
Actors: User, Delivery System
Pre condition: User possesses a currently issued book.
Flow: Main Flow:

User clicks 'Schedule Return' on an active order.
User selects a pickup time slot within working hours.
System notifies the Delivery System to schedule a pickup.
System updates order status to 'RETURN INITIATED'.
Alternate Flows:
2a. Selected time slot is outside working hours: System prompts
User to pick a valid slot.
Post Condition: A pickup is scheduled to retrieve the book.
Use Case No: UC-
Use Case Name: Apply fines
Overview: System automatically applies penalties and notifies the user if a book
is past its due date.
Actors: System
Pre condition: The current date exceeds a book's return due date.
Flow: Main Flow:

System runs daily checks on active issued books.
System identifies overdue items.
System calculates the fine and updates the User's account.
System sends an automated notification to the User.
Alternate Flows:
2a. No overdue books: System logs the check and terminates.
Post Condition: The account is penalized and the User is notified.
Use Case No: UC-
Use Case Name: Monitor account
Overview: Users view their child's reading history and track screen time on the
app.
Actors: User
Pre condition: User is logged into their dashboard.
Flow: Main Flow:

User navigates to the 'Child Activity' dashboard.
System retrieves read books, quiz scores, and app usage metrics.
System displays the data in a dashboard view.
Alternate Flows:
2a. Child has no activity: System displays "No recent activity to show".
Post Condition: User is informed of their child's engagement.
Use Case No: UC-
Use Case Name: Add Books
Overview: Librarian adds new physical inventory to the platform.
Actors: Librarian
Pre condition: Librarian is logged into his librarian account.
Flow: Main Flow:

Librarian enters new book details (Title, Author, ISBN).
System validates the inputs.
System saves the record to the catalog.
Alternate Flows:
2a. Missing fields: System prompts Librarian to complete required
data.
Post Condition: The new book is available for users to browse.
Use Case No: UC-
Use Case Name: Issue history
Overview: Librarian views the historical checkout data for any given book.
Actors: Librarian
Pre condition: Librarian is logged in and viewing inventory.
Flow: Main Flow:

Librarian selects a book and clicks 'View History'.
System retrieves past and current issue records.
System displays the timeline of borrowers.
Alternate Flows:
2a. Book has never been issued: System displays "No checkout
history".
Post Condition: Librarian successfully reviews the book's circulation history.
Use Case No: UC-
Use Case Name: Admin Dashboard
Overview: Library owner views application-wide analytics and active library
branches.
Actors: Admin
Pre condition: Admin is logged into the admin portal.
Flow: Main Flow:

Admin opens the dashboard.
System aggregates user, book, and financial data.
System renders analytical charts.
Alternate Flows:
2a. Data fetch timeout: System displays cached analytics.
Post Condition: Admin has high-level visibility into business metrics.
Use Case No: UC-22
Use Case Name: Quizzes after reading
Overview: Kids test their comprehension by taking a quiz on a recently ordered
book.
Actors: Child
Pre condition: A book has been marked as returned or finished by the user.
Flow: Main Flow:

Child navigates to 'My Books' and selects a finished book.
Child clicks 'Take Quiz'.
System presents a series of questions.
Child submits answers and System calculates the score.
Alternate Flows:
3a. No quiz available for that book: System displays a "Coming Soon"
message.
Post Condition: The quiz score is recorded and visible to the User.
Use Case No: UC-23
Use Case Name: Create new Librarian
Overview: Admin registers a new library branch and creates its corresponding
Librarian account.
Actors: Admin
Pre condition: Admin is logged into the portal.
Flow: Main Flow:

Admin navigates to 'Manage Branches' and clicks 'Add New'.
Admin enters branch details and Librarian credentials.
System creates the branch in the database and sends a welcome
email to the Librarian.
Alternate Flows:
2a. Email already in use: System prompts Admin to use a different
email.
Post Condition: A new branch is active and its Librarian can log in.