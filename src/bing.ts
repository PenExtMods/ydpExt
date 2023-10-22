
// ydpExt

// MIT License Copyright (c) 2023 Wxp

export namespace bing{
    export namespace incomeMessage{
        export interface userMesssage{
            text: string,
            timestamp: string
        }
        export namespace rawType{
            export interface userMesssage{
                author: 'user',
                inputMethod: string,
                locale: string,
                location: string,
                locationHints: object,
                market: string,
                messageType: string,
                region: string,
                text: string,
                timestamp: string
            }
            export interface userInputArgument{
                allowedMessageTypes: string[],
                conversationId: string,
                conversationSignature: string,
                isStartOfSession: boolean,
                message: incomeMessage.rawType.userMesssage,
                optionsSets: string[],
                participant: {
                    id: string
                },
                sliceIds: string[],
                source: string,
                traceId: string,
                verbosity: string
            }
        }
        export namespace raw{
            export interface userInput{
                arguments: incomeMessage.rawType.userInputArgument[],
                invocationId: string,
                target: string,
                type: 4
            }
            export interface heartbeat{
                type: 6
            }
            export interface init{
                protocol: string,
                version: number
            }
        }
    }
    export namespace outcomeMessage{
        export namespace rawType{
            export interface adaptiveCard {
                type: string,
                version: string,
                body: adaptiveCardBody[]
            }
            export interface adaptiveCardBody {
                type: string,
                text?: string,
                wrap?: boolean,
                inlines?: [{
                    type: string,
                    isSubtle: boolean,
                    italic: boolean,
                    text: string
                }]
            }
            export interface chatMessageFeedback {
                tag: null,
                updatedOn: null,
                type: string
            }
            export interface messagePartial{
                text: string,
                hiddenText?: string,
                author: 'bot',
                createdAt: string,
                timestamp: string,
                messageId: string,
                offense: string,
                adaptiveCards?: adaptiveCard[],
                sourceAttributions?: any[],
                feedback?: chatMessageFeedback,
                contentOrigin: string,
                privacy?: null,
                messageType?: string,
                suggestedResponses?: suggestedResponse[]
            }
            export interface updateMessageArgument{
                messages: messagePartial[],
                throttling?:{
                    maxNumUserMessagesInConversation: number,
                    numUserMessagesInConversation: number,
                    maxNumLongDocSummaryUserMessagesInConversation: number,
                    numLongDocSummaryUserMessagesInConversation: number
                },
                requestId: string,
                result?: null
            }
            export interface chatMessageFrom {
                id: string,
                name: null
            }
            export interface suggestedResponse {
                text: string,
                messageId: string,
                messageType: string,
                contentOrigin: string,
                author?: 'user',
                createdAt?: string,
                timestamp?: string,
                offense?: string,
                feedback?: chatMessageFeedback,
                privacy?: null
            }
            export interface messageFull {
                text: string,
                hiddenText?: string,
                author: 'bot',
                from?: chatMessageFrom,
                createdAt: string,
                timestamp: string,
                locale?: string,
                market?: string,
                region?: string,
                location?: string,
                locationHints?: object,
                messageId: string,
                requestId: string,
                offense: string,
                feedback: chatMessageFeedback,
                contentOrigin: string,
                privacy?: null,
                inputMethod?: string,
                adaptiveCards?: adaptiveCard[],
                sourceAttributions?: any[],
                suggestedResponses?: suggestedResponse[],
                messageType?: string
            }
            export interface chatRequestResult {
                value: string,
                serviceVersion: string
            }
            export interface chatResponseItem {
                messages: messageFull[],
                firstNewMessageIndex: number,
                suggestedResponses: null,
                conversationId: string,
                requestId: string,
                conversationExpiryTime: string,
                shouldInitiateConversation: boolean,
                throttling:{
                    maxNumUserMessagesInConversation: number,
                    numUserMessagesInConversation: number,
                    maxNumLongDocSummaryUserMessagesInConversation: number,
                    numLongDocSummaryUserMessagesInConversation: number
                },
                telemetry: {
                    metrics?: null,
                    startTime: string
                },
                result: chatRequestResult
            }
        }
        export namespace raw{
            export interface empty{}
            export interface updateMessage{
                type: 1,
                target: "update",
                arguments: outcomeMessage.rawType.updateMessageArgument[]
            }
            export interface updateCompleteMessage{
                type: 2,
                invocationId: string,
                item: outcomeMessage.rawType.chatResponseItem
            }
            export interface interrupt{
                type: 3,
                invocationId: string
            }
        }
    }
}