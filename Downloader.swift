//
//  Downloader.swift
//  react-native-spokestack
//
//  Created by Timothy Willison on 12/7/20.
//

import Foundation
import Network

enum RNSpokestackDownloadError: Error {
    case networkNotAvailable
    case networkStatusNotAvailable
    case noResponse
    case downloadUnsuccessful
    case documentsDirectoryNotAvailable
}

extension RNSpokestackDownloadError: LocalizedError {
    public var errorDescription: String? {
        switch self {
        case .networkNotAvailable:
            return NSLocalizedString("The network is not available. Check your network connection. If the network is cellular and you'd like to download over cellular, ensure allowCellular is set to true.", comment: "")
        case .networkStatusNotAvailable:
            return NSLocalizedString("The network status has not yet been set by iOS.", comment: "")
        case .noResponse:
            return NSLocalizedString("A download completed but there was no response.", comment: "")
        case .downloadUnsuccessful:
            return NSLocalizedString("A download completed but was not successful", comment: "")
        case .documentsDirectoryNotAvailable:
            return NSLocalizedString("The documents directory was not accesible. Please ensure react-native-spokestack has access for caching model files.", comment: "")
        }
    }
}

@objc
public class Downloader: NSObject {
    private var allowCellular: Bool
    private var refreshModels: Bool
    private let monitor = NWPathMonitor()
    private var path: NWPath?
    private var downloadQueue: [URL:(Error?, String?) -> Void] = [:]

    init(allowCellular: Bool = false, refreshModels: Bool = false) {
        self.allowCellular = allowCellular
        self.refreshModels = refreshModels
        super.init()
        monitor.pathUpdateHandler = { (path: NWPath) in
            self.path = path
            self.downloadAll()
        }
        monitor.start(queue: DispatchQueue.global(qos: .default))
    }

    deinit {
        monitor.cancel()
    }

    func isNetworkAvailable() -> Bool {
        if let path = self.path {
            return path.status == .satisfied && (allowCellular || !path.isExpensive)
        }
        return false
    }

    func downloadModel(_ url: URL, _ complete: @escaping (Error?, String?) -> Void) {
        // Wait until network status is availalbe to attempt downloading
        if self.path != nil {
            if url.host != "localhost" && !isNetworkAvailable() {
                complete(RNSpokestackDownloadError.networkNotAvailable, nil)
                return
            }
        } else {
            downloadQueue[url] = complete
            return
        }
        guard let documentsUrl =  FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first else {
            complete(RNSpokestackDownloadError.documentsDirectoryNotAvailable, nil)
            return
        }
        let destinationUrl = documentsUrl.appendingPathComponent(url.lastPathComponent)
        let destinationPath = destinationUrl.path

        if !refreshModels && FileManager().fileExists(atPath: destinationPath) {
            complete(nil, destinationPath)
            return
        }
        let session = URLSession(configuration: URLSessionConfiguration.default, delegate: nil, delegateQueue: nil)
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        let task = session.dataTask(with: request, completionHandler: {
            data, response, error in
            if error != nil {
                complete(error, destinationPath)
            }
            guard let response = response as? HTTPURLResponse  else {
                complete(RNSpokestackDownloadError.noResponse, destinationPath)
                return
            }
            if response.statusCode == 200 {
                do {
                    try data?.write(to: destinationUrl, options: Data.WritingOptions.atomic)
                    complete(error, destinationPath)
                } catch {
                    complete(error, destinationPath)
                }
            } else {
                complete(RNSpokestackDownloadError.downloadUnsuccessful, destinationPath)
            }
        })
        task.resume()
    }
    
    func downloadAll() {
        if !downloadQueue.isEmpty && isNetworkAvailable() {
            for (url, complete) in downloadQueue {
                downloadModel(url, complete)
            }
            // Reset queue
            downloadQueue = [:]
        }
    }
}
