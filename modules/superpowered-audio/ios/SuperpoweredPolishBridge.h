#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface SuperpoweredPolishBridge : NSObject

+ (BOOL)initializeWithLicenseKey:(NSString *)licenseKey error:(NSError *_Nullable *_Nullable)error;

+ (NSString *_Nullable)processFileAtPath:(NSString *)inputPath
                          outputWavPath:(NSString *)outputWavPath
                                 preset:(NSString *)preset
                                  error:(NSError *_Nullable *_Nullable)error;

/** Soft spectral mask → WAV. intensity: mild | current | strong (nil → current). */
+ (NSString *_Nullable)spectralCleanFileAtPath:(NSString *)inputPath
                                outputWavPath:(NSString *)outputWavPath
                                    intensity:(NSString *_Nullable)intensity
                                        error:(NSError *_Nullable *_Nullable)error;

/** Editor effects: reverb / echo / modulate / enhance → WAV. */
+ (NSString *_Nullable)processEffectsFileAtPath:(NSString *)inputPath
                                 outputWavPath:(NSString *)outputWavPath
                                   effectsJson:(NSString *)effectsJson
                                         error:(NSError *_Nullable *_Nullable)error;

@end

NS_ASSUME_NONNULL_END
