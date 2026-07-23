*** Settings ***
Resource  ../resources/keywords.robot
Resource  ../resources/variables.robot

Suite Setup    Load Project and Login

Test Setup    Run Keywords     
...    Go To Page    Devices    AND
...    Remove All Devices

*** Test Cases ***
Add New Device:
    Add New Device     AirScale BTS 1    SL-001    BTS    AirScale    TIM Test Lab    Test Group    Robert    10.0.0.1    22
    Check Device Info  AirScale BTS 1    SL-001    BTS    AirScale    TIM Test Lab    Test Group    Robert

Edit Device:
    Add New Device     AirScale BTS 1    SL-001    BTS    AirScale    TIM Test Lab    Test Group    Robert    10.0.0.1    22
    Edit Device        AirScale BTS 1    group=New Group    owner=Stefan
    Check Device Info  AirScale BTS 1    SL-001    BTS    AirScale    TIM Test Lab    New Group    Stefan

Remove Device:
    Add New Device     AirScale BTS 1    SL-001    BTS    AirScale    TIM Test Lab    Test Group    Robert    10.0.0.1    22
    Click Device Option    AirScale BTS 1    Remove
    Click    css=.MuiDialog-root button:has-text("Remove")
    Wait For Elements State    text=Removed
    Run Keyword And Expect Error    Row with name 'AirScale BTS 1' not found
    ...    Check Device Info    AirScale BTS 1    SL-001    BTS    AirScale    TIM Test Lab    Test Group    Robert