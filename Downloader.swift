//
//  downloadModel.swift
//  react-native-spokestack
//
//  Created by Timothy Willison on 12/7/20.
//

import Foundation
import Network

@objc
public class Downloader: NSObject {
    private var allowCellular: Bool = false
    private var refreshModels: Bool = false
    private let monitor = NWPathMonitor()
    private var path: NWPath?
    private var downloadQueue: [URL:(Error?, String?) -> Void] = [:]
    lazy var pathUpdateHandler = { (path: NWPath) in
        self.path = path
        if self.isNetworkAvailable() && !self.downloadQueue.isEmpty {
            print("Downloader: executing from pathUpdateHandler")
            for (url, complete) in self.downloadQueue {
                self.downloadModel(url, complete)
            }
            // Reset queue
            self.downloadQueue = [:]
        }
    }

    init(allowCellular: Bool, refreshModels: Bool) {
        super.init()
        self.allowCellular = allowCellular
        self.refreshModels = refreshModels
        monitor.pathUpdateHandler = pathUpdateHandler
        // Start monitor on background queue
        monitor.start(queue: DispatchQueue.global(qos: .default))
    }
    
    deinit {
        monitor.cancel()
    }
    
    func hasStatus() -> Bool {
        return self.path != nil
    }

    func isNetworkAvailable() -> Bool {
        if let path = self.path {
            return path.status == .satisfied && (allowCellular || !path.isExpensive)
        }
        return false
    }

    func downloadModel(_ url: URL, _ complete: @escaping (Error?, String?) -> Void) {
        // Wait until network status is availalbe to attempt downloading
        if hasStatus() {
            if url.host != "localhost" && !isNetworkAvailable() {
                print("Checking network connection")
                complete(RNSpokestackError.networkNotAvailable, nil)
                return
            }
        } else {
            downloadQueue[url] = complete
            return
        }
        let documentsUrl =  FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        let destinationUrl = documentsUrl.appendingPathComponent(url.lastPathComponent)

        if !refreshModels && FileManager().fileExists(atPath: destinationUrl.path) {
            print("Returning existing file at [\(destinationUrl.path)]")
            complete(nil, destinationUrl.path)
            return
        }
        print("Retrieving model file from \(url)")
        let session = URLSession(configuration: URLSessionConfiguration.default, delegate: nil, delegateQueue: nil)
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        let task = session.dataTask(with: request, completionHandler: {
            data, response, error in
            if error == nil {
                if let response = response as? HTTPURLResponse {
                    if response.statusCode == 200 {
                        if let data = data {
                            do {
                                try data.write(to: destinationUrl, options: Data.WritingOptions.atomic)
                            } catch {
                                complete(error, destinationUrl.path)
                            }
                        }
                        complete(error, destinationUrl.path)
                    }
                }
            } else {
                complete(error, destinationUrl.path)
            }
        })
        task.resume()
    }
}

