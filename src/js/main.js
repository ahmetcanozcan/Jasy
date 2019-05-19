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
  ipcRenderer
} = require('electron');

const fs = require('fs');

const spawn = require('child_process').spawnSync;


const app = new Vue({
  el: '#app',
  data: {
    isLoading: false,
    isMaximized: false,
    code: "",
    fontSize: 26,
    logs: [],
    seenOpenModal: false,
    filePath: "",
    responseList: [],
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
        let str = fs.readFileSync(path);
        this.code = str.toString();
      } catch (err) {
        alert('That\'s not a valid file');
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
      let child = spawn('node', ['-e', this.code]);
      let out = (child.stdout || "").toString();
      let err = (child.stderr || "").toString();
      let outArr = out.split("\n");
      let errArr = err.split("\n");
      console.log(err, errArr);
      console.log(outArr, errArr);
      this.logs = [...outArr, ...errArr];

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
      console.log(start, end);
      this.code = this.code.substring(0, start) +
        "\t" +
        this.code.substring(end);

      elm.selectionStart = elm.selectionEnd = start + 1;

      // prevent the focus lose
      e.preventDefault();

    }
  },

  computed: {
    gutter() {
      return this.code.split('\n').length;
    }
  }
});