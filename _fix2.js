var fs = require("fs");
var f = "d:/KKU_Final/nutrition-app/nutrition-backend/scripts/migrate_schemas.js";
var c = fs.readFileSync(f, "utf8");
// Find all instances of (" followed by raw newline and fix them
var fixed = c.replace(/\.log\("\r?\n/g, ".log(\"\\n");
fixed = fixed.replace(/\.error\("\r?\n/g, ".error(\"\\n");
// Also fix any ("\n that is not already \\n
fixed = fixed.replace(/"\r?\n/g, function(match) {
  return "\\n";
});
// Wait, too aggressive - let me be more targeted
// Actually, let me just use a simpler approach: replace the raw newlines inside string literals
var lines = c.split(/\r?\n/);
var result = [];
var inString = false;
for (var i = 0; i < lines.length; i++) {
  var line = lines[i];
  // Check if this line is a continuation of a string from previous line
  if (inString) {
    // This is a continuation - prepend escaped newline
    var trimmed = line.trimStart();
    result[result.length - 1] = result[result.length - 1].slice(0, -1) + \\n" + trimmed;
    if (trimmed.endsWith(\";\") || trimmed.endsWith(\"}\")) inString = false;
  } else {
    result.push(line);
    // Check if line has unclosed string
    var quotes = (line.match(/\"/g) || []).length;
    if (quotes % 2 !== 0) inString = true;
  }
}
console.log("Done, not using this approach");
