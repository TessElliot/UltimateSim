export default class NewspaperScene extends Phaser.Scene {
  constructor () {
    super('newspaper');
  }

  // data = { headline, bodyLines:Array<string>, onClose:fn }
  init (data) {
    this.headline = data.headline   || 'BREAKING NEWS';
    this.bodyLines = data.bodyLines || ['More details soon…'];
    this.onClose   = typeof data.onClose === 'function' ? data.onClose : ()=>{};
  }

  preload () {
    // the background image  added in preloadAssets.js
    // scene.load.image('paper_bg', 'assets/paper_bg.png');
  }

  create () {
    const { width, height } = this.cameras.main;

    // semi-transparent overlay to block interaction with underlying scenes
    this.add.rectangle(0, 0, width, height, 0x000000, 0.45)
        .setOrigin(0)
        .setInteractive();

    // newspaper background
    const bg = this.add.image(width / 2, height / 2, 'paper_bg')
        .setOrigin(0.5)
        .setScale(0.8);

    /*──────────────── CONTENT LAYOUT ────────────────*/
    const pageTop     = bg.y - bg.displayHeight / 2 + 120;      // leave space for picture header inside texture
    const gutter      = 40;
    const colWidth    = (bg.displayWidth - gutter * 3) / 2;     // two columns with gutters

    // MAIN ARTICLE – left column
    let cursorY = pageTop;
    const mainHead = this.add.text(bg.x - bg.displayWidth / 2 + gutter, cursorY,
      this.headline, {
        fontFamily: 'Georgia',
        fontSize: 26,
        fontStyle: 'bold',
        color: '#000',
        wordWrap: { width: colWidth }
      }).setOrigin(0, 0);

    cursorY += mainHead.height + 10;

    this.add.text(mainHead.x, cursorY, this.bodyLines.join('\n\n'), {
      fontFamily: 'Times New Roman',
      fontSize: 18,
      color: '#222',
      wordWrap: { width: colWidth }
    }).setOrigin(0, 0);

    // SIDE ARTICLES – right column (dummy / lorem ipsum)
    const fillerLines = [
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla euismod urna vitae libero pretium, a dignissim massa luctus.',
      'Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Integer quis magna non elit cursus placerat.'
    ];

    let sideY = pageTop;
    const sideX = bg.x - bg.displayWidth / 2 + gutter * 2 + colWidth;

    fillerLines.forEach(txt => {
      const para = this.add.text(sideX, sideY, txt, {
        fontFamily: 'Times New Roman',
        fontSize: 14,
        color: '#333',
        wordWrap: { width: colWidth }
      }).setOrigin(0, 0);

      sideY += para.height + 12;
    });

    // close button
    this.add.text(bg.x, bg.y + bg.displayHeight / 2 - 30, '[ Close ]', {
      fontFamily: 'Arial',
      fontSize: 24,
      color: '#0033aa',
      backgroundColor: '#ffffff',
    }).setOrigin(0.5, 1)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        this.onClose();
        this.scene.stop();
      });
  }
} 