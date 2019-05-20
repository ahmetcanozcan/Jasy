Vue.component('openModal', {
  template: '#open-modal',
  mounted() {
    var holder = document.getElementById('drag-file');

    holder.ondragover = () => {
      return false;
    };

    holder.ondragleave = () => {
      return false;
    };

    holder.ondragend = () => {
      return false;
    };

    holder.ondrop = (e) => {
      e.preventDefault();

      for (let f of e.dataTransfer.files) {
        console.log(f.path);
        this.$emit('filepath', f.path);
        this.$emit('close');
        return false;
      }

      return false;
    };
  }
})
const {
  ipcRenderer,
  remote
} = require('electron');
const path = require('path');
const fs = require('fs');

const spawn = require('child_process').spawn;


const app = new Vue({
  el: '#app',
  data: {
    isLoading: false,
    isMaximized: false,
    code: "",
    fontSize: 26,
    terminalHeight: 0,
    resizingTerminal: false,
    logs: [],
    seenOpenModal: false,
    filePath: "",
    responseList: [],
    child: null,
  },
  created() {
    let argv = remote.process.argv;
    console.log("arguments", argv);
    if (argv.length == 2) {
      let fileName = argv[1];
      let filePath = path.join(process.cwd(), fileName);
      this.readFile(filePath);
    }

    var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    this.terminalHeight = h * 3 / 10;
  },
  mounted() {
    window.addEventListener('mouseup', this.stopTerminalResize);
    window.addEventListener('mousemove', this.doResize);
  },
  methods: {
    close() {
      window.close();
    },
    minimize() {
      ipcRenderer.send('minimize-main-window');
    },
    togglize() {
      ipcRenderer.send('togglize-main-window', this.isMaximized);
      this.isMaximized = !this.isMaximized;
    },
    readFile(path) {
      if (!path) {
        alert('There is no file');
        return;
      }
      this.isLoading = true;
      this.filePath = path;
      try {
        console.log(path);
        let str = fs.readFileSync(path);
        this.code = str.toString();
      } catch (err) {
        alert('That\'s not a valid file' + err);
      }

      this.isLoading = false;
    },
    pushResponse(obj) {
      this.responseList.push(Object.assign({
        color: 'green'
      }, obj));
      setTimeout(() => {
        this.responseList.pop();
      }, 1500);
    },
    run() {
      this.logs = [];
      if (this.filePath == "") {
        this.child = spawn('node', ['-e', this.code]);
      } else {
        this.child = spawn('node', [this.filePath]);
      }
      console.log(this.child);
      let hrstart = process.hrtime();
      this.child.stdout.on('data', data => {
        this.logs.push(data);
      });

      this.child.stderr.on('data', data => {
        this.logs.push(data);
      });
      let hrend = process.hrtime(hrstart);
      this.child.on('close', code => {
        this.logs.push(`Exit ${code}`);
        this.logs.push(`Your code executed in ${hrend[0]}s ${hrend[1]/10e6}ms`);
      })
    },
    saveFile() {
      if (!this.filePath) {
        this.saveAsFile();
        return;
      }
      fs.writeFile(this.filePath, this.code, err => {
        if (err) {
          alert('Opps... Something went wrong.\n' + err);
        }
      })
      this.pushResponse({
        color: 'green',
        text: 'Saved successfully'
      });
    },
    saveAsFile() {
      ipcRenderer.send("saveAsDialog");
      ipcRenderer.on("saveAsDialog", (event, arg) => {
        if (!arg) {
          alert('Oppss...');
          return;
        }
        this.filePath = arg;
        this.saveFile();
      })
    },
    keyDownMonitor(e) {

    },

    tabClick(e) {
      let elm = document.getElementById('code-editor');
      let start = elm.selectionStart;
      let end = elm.selectionEnd;
      this.code = this.code.substring(0, start) +
        "\t" +
        this.code.substring(end);

      elm.selectionStart = elm.selectionEnd = start + 1;

      // prevent the focus lose
      e.preventDefault();

    },
    startTerminalResize() {
      this.resizingTerminal = true;
    },
    stopTerminalResize() {
      this.resizingTerminal = false;

    },
    doResize(event) {
      if (this.resizingTerminal) {
        let vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        this.terminalHeight = vh - event.clientY;
      }
    }
  },
  computed: {
    gutter() {
      return this.code.split('\n').length;
    }
  }
});