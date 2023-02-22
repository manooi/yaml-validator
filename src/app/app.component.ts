import { Component } from '@angular/core';
import { parse, stringify } from 'yaml';

export enum YamlDataType {
  STRING = 'string',
  ARRAY = 'array',
  OBJECT = 'object',
  BOOLEAN = 'boolean',
  NUMBER = 'number',
  INT = 'int',
  NULL = 'null',
  DICT = 'dict'
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'yaml';
  file: any;
  yaml: any;
  errors: any[] = [];
  isValidated: boolean = false;
  config: string = `
  config = {
    Branch: ARRAY,
    Level: NUMBER,
    NodeID: STRING,
    RefNodeID: NULL,
    NodeName: STRING,
    DoAAuthlevel: NUMBER,
  }

  for 'Org.SCG.CBM.ND.SCGINTL.v02 - Copy.yaml' only
  `;

  onFileChange(event: any) {
    try {
      this.isValidated = false;
      // console.log(event?.target?.files[0]);
      const target: DataTransfer = <DataTransfer>(event.target);
      const reader: FileReader = new FileReader();
      reader.onload = (e: any) => {
        const yaml = parse(this.readUTF8String(e.target.result));
        this.yaml = yaml;
        this.file = this.readUTF8String(stringify(yaml));
        // console.log(yaml);
      };
      reader.readAsBinaryString(target.files[0]);
    }
    catch {

    }
  }

  onInputChange(event: any) {
    this.yaml = parse(this.readUTF8String(event.target.value));
    this.isValidated = false;
  }

  branchConfig: any = {
    Branch: YamlDataType.ARRAY,
    Level: YamlDataType.NUMBER,
    NodeID: YamlDataType.STRING,
    RefNodeID: YamlDataType.NULL,
    NodeName: YamlDataType.STRING,
    DoAAuthlevel: YamlDataType.NUMBER,
  }

  isTypeCorrect(value: any, config: string): boolean {
    if (!config) {
      return true;
    }

    switch (config) {
      case YamlDataType.ARRAY:
        return Array.isArray(value);

      case YamlDataType.INT:
      case YamlDataType.NUMBER:
        return typeof (value) === 'number';

      case YamlDataType.NULL:
        return value === null;

      case YamlDataType.STRING:
        return typeof (value) === 'string';

      default:
        return false;
    }
  }

  validate(): any {
    this.errors = [];
    const branches = this.yaml?.OrgContents?.Branch;
    branches?.forEach((branch: any) => {
      this.transverseAndValidate(branch, 12);
    });
    this.isValidated = true;
  }

  print(obj: any): string {
    const keys = Object.keys(this.branchConfig);
    return keys.map((key) => {
      if (key !== 'Branch') {
        return `${key}: ${obj[key] ?? '(missing)'}`;
      }
      return null;
    }).join(", ");
  }

  transverseAndValidate(obj: any, line: number) {
    let objCount: number = 0;
    let lastObj: any;
    let missingAttributes: Set<string> = new Set();
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null && obj[key] !== undefined) {
        // if (objCount > 0 && objCount < 7) {
        // console.log(lastObj);
        // let errMsg = `Missing propertie(s) in line ${line + objCount}`;
        // this.errors.push({row: line + objCount, error: errMsg})
        // this.errors.push({ row: 'n/a', error: `Missing properties at${this.print(lastObj)}` });
        // }
        this.transverseAndValidate(obj[key], line + objCount);
      }

      else {
        objCount += 1;
        lastObj = obj;
        if (!this.isTypeCorrect(obj[key], this.branchConfig[key])) {
          this.errors.push({ row: 'n/a', error: `${key} Should be ${this.branchConfig[key]}` })
        }
        // Not in config (exceed)
        else if (!this.branchConfig[key]) {
          this.errors.push({ row: 'n/a', error: `Exceed attribute '${key}'` })
        }

        // Missing
        else if (Object.keys(obj).length < Object.keys(this.branchConfig).length) {
          let missings: string[] = this.findDff(Object.keys(this.branchConfig), Object.keys(obj));
          if (!missings.includes('Branch')) {
            missings.forEach((m) => missingAttributes.add(m));
          }
        }
      }
    }

    if (missingAttributes.size > 0) {
      this.errors.push({ row: 'n/a', error: `Missing attritube ${Array.from(missingAttributes).join(", ")}` });
    }
  }

  findDff(source: string[], des: string[]) {
    return source.filter((s) => !des.includes(s));
  }

  readUTF8String(bytes: any) {
    var ix = 0;

    if (bytes.slice(0, 3) == "\xEF\xBB\xBF") {
      ix = 3;
    }

    var string = "";
    for (; ix < bytes.length; ix++) {
      var byte1 = bytes[ix].charCodeAt(0);
      if (byte1 < 0x80) {
        string += String.fromCharCode(byte1);
      } else if (byte1 >= 0xC2 && byte1 < 0xE0) {
        var byte2 = bytes[++ix].charCodeAt(0);
        string += String.fromCharCode(((byte1 & 0x1F) << 6) + (byte2 & 0x3F));
      } else if (byte1 >= 0xE0 && byte1 < 0xF0) {
        var byte2 = bytes[++ix].charCodeAt(0);
        var byte3 = bytes[++ix].charCodeAt(0);
        string += String.fromCharCode(((byte1 & 0xFF) << 12) + ((byte2 & 0x3F) << 6) + (byte3 & 0x3F));
      } else if (byte1 >= 0xF0 && byte1 < 0xF5) {
        var byte2 = bytes[++ix].charCodeAt(0);
        var byte3 = bytes[++ix].charCodeAt(0);
        var byte4 = bytes[++ix].charCodeAt(0);
        var codepoint = ((byte1 & 0x07) << 18) + ((byte2 & 0x3F) << 12) + ((byte3 & 0x3F) << 6) + (byte4 & 0x3F);
        codepoint -= 0x10000;
        string += String.fromCharCode(
          (codepoint >> 10) + 0xD800, (codepoint & 0x3FF) + 0xDC00
        );
      }
    }

    return string;
  }

  clear() {
    this.file = null;
  }
}
