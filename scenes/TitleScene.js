
export class TitleScene extends Phaser.Scene {

    constructor() {
        super("bootGame");
    }

    init() {

    }

    preload() {
        

    }

    create() {
        const text = this.add.text(500, 300, 'Utimate Sim Start');

        text.setOrigin(0.5, 0.5);
        text.setInteractive();

        text.on('pointerdown',() => {
            text.setVisible(false);
            this.showMenu();
            });
    }


    
    
    
    showMenu(){
       /* showMenu() displays menu with two options : 'start Game' Button and 'Resume Game' Button */

        // Defining two buttons
        const startGameButton = this.add.text(500,250,'Start',{fill:'#0f0'});
        const resumeGameButton =this.add.text(500,300,'Resume Game',{fill:'#0f0'});

       //making the buttons interactive
        startGameButton.setOrigin(0.5,0.5).setInteractive();
        resumeGameButton.setOrigin(0.5,0.5).setInteractive();
    

        //locationOptions() is called upon choosing "Start Game" Button
        startGameButton.on('pointerdown',() =>{
            startGameButton.setVisible(false);
            resumeGameButton.setVisible(false);
            this.locationOptions();
            
        })
    
        //loadSavedGame() is called when ResumeGame is Clicked Upon
        resumeGameButton.on('pointerdown',() =>{
            startGameButton.setVisible(false);
            resumeGameButton.setVisible(false);
            this.loadSavedGame();
        })
    
    }


    locationOptions(){

        const currentLocationButton=this.add.text(500,250,'Current Location',{fill:'#0f0'});
        const manualLocationButton= this.add.text(500,300,'Manual Location',{fill:"#0f0"});


        currentLocationButton.setOrigin(0.5,0.5).setInteractive();
        manualLocationButton.setOrigin(0.5,0.5).setInteractive();


         currentLocationButton.on('pointerdown',()=>{
            currentLocationButton.setVisible(false);
            manualLocationButton.setVisible(false);
            window.locationChoice='currentLocatoin';
            // this.scence.start('UI');
            this.scene.start('UI');
            this.scene.start('playingGame');

        });


        manualLocationButton.on('pointerdown', () => {
            currentLocationButton.setVisible(false);
            manualLocationButton.setVisible(false);
            window.locationChoice = 'manual'; 
            this.manualLocationForm(() => {
                // This callback will be triggered after the form submission is complete
                this.scene.start('playingGame');
            });
        });
    }






    manualLocationForm(callback){
        const formHTML = `
        <form id="locationForm" style="background-color: white; padding: 10px;">
            <label for="city">City:</label>
            <input type="text" id="city" name="city"><br><br>
            <label for="state">State:</label>
            <input type="text" id="state" name="state"><br><br>
            <button type="button" id="submitButton">Submit</button>
        </form>
        `;


    const element = this.add.dom(500, 300).createFromHTML(formHTML);
    element.setOrigin(0.5, 0.5);

    // Wait until the element is added to the DOM before setting up the form submission
    this.setupFormSubmission(callback);

    console.log("Form added to scene and centered");
    }


    setupFormSubmission(callback) {
        const submitButton = document.getElementById('submitButton');
        
        // Add event listener for form submission
        submitButton.addEventListener('click', () => {
            // Get values from the form
            const city = document.getElementById('city').value;
            const state = document.getElementById('state').value;
    
            if (city && state) {
                // Call the function to fetch latitude and longitude
                this.fetchLatLon(city, state, callback);
                console.log("City received:", city, state);
            } else {
                console.log("Please enter both city and state.");
            }
        });
    }

    fetchLatLon(city, state, callback) {
        const apiUrl = `https://nominatim.openstreetmap.org/search?city=${city}&state=${state}&format=json&limit=1`;
    
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    const lat = data[0].lat;
                    const lon = data[0].lon;
                    console.log(`Latitude: ${lat}, Longitude: ${lon}`);
    
                    // Trigger the callback after fetching lat/lon
                    if (callback) {
                        callback();  // This will start the next scene
                    }
    
                } else {
                    console.log("Location not found.");
                }
            })
            .catch(error => {
                console.error("Error fetching latitude and longitude:", error);
            });
    }




    loadSavedGame() {
        const savedMapString = localStorage.getItem('savedMap');
        if (savedMapString) {
            // Start the playingGame scene with a flag to resume
            this.scene.start('playingGame', { resume: true });
        } else {
            // No saved game found, inform the user
            alert('No saved game found. Starting a new game.');
            this.locationOptions();
        }
    }
}