import { generateCompletion } from "@anvia/core";
import { model } from "./src/model";

const res = await generateCompletion({
  model,
  prompt: "can u speak bahasa ?",
  instructions: "you are a helpful assistant",
});
console.log(res.output);
console.log(res.usage);
