from .states import OverallState
from .prompts import PromptsEnums
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from core.llm_factories import get_llm_model
from .formatted_responses import ValidatorDecision, MainAgentResponse
import orjson
from datetime import datetime
from .tools import create_event_tool, delete_event_tool, get_all_events_tool, edit_event_tool, find_free_time_tool, find_similar_contacts_tool, get_calendar_invitations_tool
from langchain_core.output_parsers import PydanticOutputParser

async def validator_agent(state: OverallState):
    if state.validator_messages == []:
        system_prompt = SystemMessage(
            content=PromptsEnums.VALIDATOR_SYSTEM_PROMPT.value.strip()
        )
        messages = [system_prompt]
    else:
        messages = state.validator_messages

    messages.append(HumanMessage(content=state.user_message))
    
    llm = get_llm_model()
    output = await llm.with_structured_output(
        schema=ValidatorDecision, include_raw=True, strict=True
    ).ainvoke(messages)
    parsed: ValidatorDecision = output["parsed"]
    messages.append(
        AIMessage(
            content=orjson.dumps(
                parsed.model_dump(), option=orjson.OPT_INDENT_2
            ).decode()
        )
    )
    return {
        "validator_messages": (
            messages if state.validator_messages == [] else messages[-2:]
        ),
        "is_valid_user_input": parsed.valid,
        "response": parsed.response,
    }

async def main_agent(state: OverallState):
    if state.main_agent_messages == []:
        system_prompt = SystemMessage(
            content=PromptsEnums.MAIN_AGENT_SYSTEM_PROMPT.value.strip().format(today_date=datetime.now().astimezone().isoformat())
        )
        messages = [system_prompt]
    else:
        messages = state.main_agent_messages
    
    messages.append(
        HumanMessage(
            content=state.user_message
            + f"\n\n --- \n\n Only {state.tool_calls_left} tool calls left."
        )
    )

    llm = get_llm_model()
    llm_with_tools = llm.bind_tools([
                create_event_tool, 
                delete_event_tool,
                get_all_events_tool, 
                edit_event_tool,
                # find_free_time_tool,
                find_similar_contacts_tool,
                get_calendar_invitations_tool,
                ],
                )
    output: AIMessage = await llm_with_tools.ainvoke(messages)
    messages.append(output)
    if not output.tool_calls:
        try:
            parser = PydanticOutputParser(pydantic_object=MainAgentResponse)
            parsed = await parser.aparse(output.content)
        except Exception as e:
            parsed = MainAgentResponse(response=output.content)
    return {
        "main_agent_messages": (
            messages if state.main_agent_messages == [] else messages[-2:]
        ),
        "response": parsed.response if not output.tool_calls else "",
        "tool_calls_left": (
            state.tool_calls_left - 1 if output.tool_calls else state.tool_calls_left
        ),
    }