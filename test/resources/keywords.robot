*** Settings ***
Library  Browser    enable_presenter_mode=True

Resource  ./variables.robot


*** Keywords ***

Load Project
    [Documentation]
    ...    Open a new Robot Framework Browser window and navigate to the project
    New Browser    headless=False     timeout=60s
    New Context    viewport={'width': 1280, 'height': 800}
    New Page       ${FRONTEND_URL}

Attempt Login
    [Documentation]
    ...    Attempt to login with given credentials
    [Arguments]
    ...    ${username}=${TEST_USER}    
    ...    ${password}=${TEST_PASSWORD}    
    ...    ${url}=${FRONTEND_URL}
    
    Go To    ${url}

    Wait For Elements State    span:has-text("Login")

    Type Text    input#username    ${username}
    Type Secret  input#password    $password

    Click    button:has-text("Login")
    
    Check Logged In

Check Logged In
    [Documentation]
    ...    Check that the user is logged in (sidebar menu options are visible)
    Wait For Elements State    .MuiListItemButton-root:has-text("Home")       visible
    Wait For Elements State    .MuiListItemButton-root:has-text("Devices")    visible
    Wait For Elements State    [aria-label="logout"]                          visible

Load Project and Login
    [Documentation]
    ...    Start a browser session and login with the default user ${TEST_USER}
    Load Project
    Attempt Login

Go To Page
    [Documentation]
    ...    Navigate to a page available in the sidebar
    [Arguments]
    ...    ${page}

    Click    .MuiListItemButton-root:has-text("${page}")

Add New Device
    [Documentation]
    ...    Add a new device (must already be on the Devices page)
    [Arguments]
    ...    ${name}
    ...    ${slNo}
    ...    ${deviceType}
    ...    ${hwType}
    ...    ${site}
    ...    ${group}
    ...    ${owner}
    ...    ${ip}
    ...    ${port}
    ...    ${connectivity}=SSH
    ...    ${loginUser}=admin
    ...    ${password}=hunter2
    
    Click    button:has-text("Add Device")
    Wait For Elements State    css=#add-device-form    visible

    Fill Text    input[name="deviceName"]    ${name}
    Fill Text    input[name="deviceSlNo"]    ${slNo}
    Fill Text    input[name="deviceType"]    ${deviceType}
    Fill Text    input[name="hwType"]    ${hwType}
    Fill Text    input[name="site"]    ${site}
    Fill Text    input[name="group"]    ${group}
    Fill Text    input[name="owner"]    ${owner}
    Fill Text    input[name="ip"]    ${ip}
    Fill Text    input[name="port"]    ${port}

    # Connectivity Type is a MUI Select, not a native input
    Click    css=#add-device-form [role="combobox"]
    Click    li:has-text("${connectivity}")

    Fill Text    input[name="loginUser"]    ${loginUser}
    Fill Text    input[name="password"]    ${password}

    Click    button:has-text("Submit")

    Wait For Elements State    "Device added."

Check Device Info
    [Documentation]
    ...    Check device information for given name in the devices table
    [Arguments]
    ...    ${name}
    ...    ${slNo}
    ...    ${deviceType}
    ...    ${hwType}
    ...    ${site}
    ...    ${group}
    ...    ${owner}
    
    @{expected_values}    Create List    ${slNo}    ${deviceType}    ${hwType}    ${site}    ${group}    ${owner}

    ${rows}=    Get Elements    css=table.MuiTable-root tbody > tr

    ${row_found}=    Set Variable    ${False}

    FOR    ${row}    IN    @{rows}
        ${columns}=    Get Elements    ${row} >> css=td
        ${col_name}=   Get Text        ${columns}[0]

        Log    ${col_name}

        IF    '${col_name}' == '${name}'
            ${row_found}=    Set Variable    ${True}
            FOR    ${i}    IN RANGE    0    6
                ${table_index}=    Evaluate                    ${i} + 1
                ${text}=           Get Text                    ${columns}[${table_index}]
                Should Be Equal    ${expected_values}[${i}]    ${text}
            END
        END
    END

    IF    not ${row_found}
        Fail    Row with name '${name}' not found
    END

Remove All Devices
    [Documentation]
    ...    Removes all devices

    WHILE    True    limit=100
        ${actions}=    Get Element Count    css=table.MuiTable-root tbody button
        IF    ${actions} == 0    BREAK
        
        # Click the button in the last column
        ${button}=    Get Element    css=table.MuiTable-root tbody > tr:last-child >> td:last-child >> button
        Click         ${button}
        Click         li:has-text("Remove")

        # Confirm the deletion dialog and wait for it to close
        Click    css=.MuiDialog-root button:has-text("Remove")
        Wait For Elements State    css=.MuiDialog-root    detached
    END

Click Device Option
    [Documentation]
    ...    Clicks the action button on the row where the device name matches.
    [Arguments]
    ...    ${name}
    ...    ${option}

    ${rows}=    Get Elements    css=table.MuiTable-root tbody > tr
    ${row_found}=    Set Variable    ${False}

    FOR    ${row}    IN    @{rows}
        ${columns}=    Get Elements    ${row} >> css=td
        ${col_name}=   Get Text        ${columns}[0]

        IF    '${col_name}' == '${name}'
            # Click the button in the last column
            ${button}=     Get Element    ${columns}[-1] >> css=button
            Click          ${button}
            Click          "${option}"
            ${row_found}=  Set Variable   ${True}
            Exit For Loop
        END
    END

    IF    not ${row_found}
        Fail    Row with name '${name}' not found
    END

Click Device Option by Index
    [Documentation]
    ...    Clicks the action button on the row where the device name matches.
    [Arguments]
    ...    ${index}
    ...    ${option}

    ${row}=     Get Element    css=table.MuiTable-root tbody > tr:nth-child(${index})
    ${button}=  Get Element    ${row} >> css=td:last-child > button
    Click       ${button}
    Click       li:has-text("${option}")


Edit Device
    [Documentation]
    ...    Edit a given device's editable details (device name cannot be changed)
    [Arguments]
    ...    ${name}
    ...    ${group}=${EMPTY}
    ...    ${owner}=${EMPTY}
    ...    ${site}=${EMPTY}
    ...    ${deviceType}=${EMPTY}
    ...    ${hwType}=${EMPTY}
    ...    ${slNo}=${EMPTY}
    
    Click Device Option    ${name}    Edit
    Wait For Elements State    css=#edit-device-form    visible

    IF    "${group}" != "${EMPTY}"
        Fill Text    input[name="group"]    ${group}
    END
    IF    "${owner}" != "${EMPTY}"
        Fill Text    input[name="owner"]    ${owner}
    END
    IF    "${site}" != "${EMPTY}"
        Fill Text    input[name="site"]    ${site}
    END
    IF    "${deviceType}" != "${EMPTY}"
        Fill Text    input[name="deviceType"]    ${deviceType}
    END
    IF    "${hwType}" != "${EMPTY}"
        Fill Text    input[name="hwType"]    ${hwType}
    END
    IF    "${slNo}" != "${EMPTY}"
        Fill Text    input[name="deviceSlNo"]    ${slNo}
    END

    Click    button:has-text("Save")
    Wait For Elements State    "Device updated."