Making IE10 work on the surface pro
===================================
Media capture
-------------
IE10 does not implement WebRTC in the stock browser. However, there is 
a plugin that adds an WebRTC-compatible API. Go to the link below, select Media
Capture API, and install it.

	http://html5labs.interoperabilitybridges.com/

Disable ActiveX warnings
------------------------
By default IE10 will display 3 warnings when you try to use the WebRTC plugin you installed above. To disable:

	IE10:Settings -> Internet Options -> Security -> Custom level
	set "Automatic prompting for ActiveX controls" to "Enable"
	set "Initialize and script ActiveX controls not marked..." to "Enable" 

Disable IE10 Security warnings
------------------------------
Now that we have changed the security settings of IE, there will be an onslaught of warnings about your computer being at risk.  To disable them, create a fix.reg file, paste the lines below, and merge it:

	Windows Registry Editor Version 5.00

	[HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Internet Explorer\Security]   
	"DisableSecuritySettingsCheck"=dword:00000001  
	"DisableFixSecuritySettings"=dword:00000001  
	"DisableSecuritySettings"=dword:00000001


