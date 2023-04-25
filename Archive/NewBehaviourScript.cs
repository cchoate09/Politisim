using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public class Buttons : MonoBehaviour
{
    // Start is called before the first frame update
    public void changeToMainScene()
    {
        SceneManager.LoadScene("Campaign");
    }

    // Update is called once per frame
    public void quitGame()
    {
        Application.Quit();
    }
}
