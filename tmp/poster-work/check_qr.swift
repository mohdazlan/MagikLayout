import Foundation
import Vision
let request = VNDetectBarcodesRequest()
let handler = VNImageRequestHandler(url: URL(fileURLWithPath: CommandLine.arguments[1]), options: [:])
try handler.perform([request])
for result in request.results ?? [] { print(result.payloadStringValue ?? "No payload") }
