var config = {
    type: Phaser.AUTO, ///automatically renders the best stlye (canvas or webGL)
    width: window.innerWidth * 0.9,  //widht of game window in pixels
    height: window.innerHeight * 0.9, //height of game window inm pixels
    parent: 'game-container', // where in html the game canvas will be inserted
    scene: {
        preload: preload,
        create: create,
        update: update
    }     ///three main functions that make up the gamme scene 
};

var game = new Phaser.Game(config); //the above conigureations are passed into new phaser instance 

function preload(){
  this.load.image('blue','assets/blue_tile.png');
  this.load.image('red','assets/red_tile.png');
}

function create()
{
  const tileWidhtHalf=32/2;
  const tileHeightHalf=32/2;
  const mapWidht=100;
  const mapHieght=100;
  for(let y=0;y<mapHieght;y++)
  {
    for(let x=0;x<mapWidht;x++)
    {
        const screenX=(x-y)*tileWidhtHalf;
        const screenY=(x+y)*tileHeightHalf;
        this.add.image(500+screenX,10+screenY,'blue');
        this.add.image(500+screenX,10+screenY,'red');

    }
  }



}
function update()
{


}